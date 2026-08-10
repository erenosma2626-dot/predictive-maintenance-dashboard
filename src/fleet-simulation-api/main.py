import os
import asyncio
import pickle
from contextlib import asynccontextmanager
from datetime import datetime
import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
from azure.ai.inference import ChatCompletionsClient
from azure.core.credentials import AzureKeyCredential

# ---- Config ----
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(BASE_DIR, ".env"))

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

MODELS_DIR = os.path.join(BASE_DIR, "models")
N_MACHINES = 12
LIFE_STEP_PCT = 0.5
NOISE_SCALE = 0.3
TICK_INTERVAL_SECONDS = 3
RISK_THRESHOLD = 0.75

FAULT_TYPES_BEARING = ["inner_race", "outer_race", "roller_element"]
FAULT_TYPES_CMAPSS = ["HPC_Degradation", "LPT_Degradation", "Fan_Degradation"]

# ---- Load Bearing model + templates ----
try:
    with open(os.path.join(MODELS_DIR, "bearing_model.pkl"), "rb") as f:
        bearing_model = pickle.load(f)
    avg_template = pd.read_csv(os.path.join(MODELS_DIR, "bearing_avg_template.csv"))
    std_template = pd.read_csv(os.path.join(MODELS_DIR, "bearing_std_template.csv"))
except Exception as e:
    print(f"Warning: Could not load bearing model: {e}")
    bearing_model, avg_template, std_template = None, None, None

feature_cols = ["rms_rm_norm", "kurtosis_rm_norm"]

# ---- Simulation state ----
rng = np.random.default_rng()

machines_state = {"bearing": {}, "cmapss": {}}
_already_flagged = {"bearing": set(), "cmapss": set()}
_active_repairs = {"bearing": {}, "cmapss": {}}
_already_diagnosed = {"bearing": set(), "cmapss": set()}
_current_month_number = {"bearing": 1, "cmapss": 1}

def init_machine_state(machine_id, dataset_type):
    fault_types = FAULT_TYPES_BEARING if dataset_type == "bearing" else FAULT_TYPES_CMAPSS
    return {
        "id": machine_id,
        "dataset_type": dataset_type,
        "life_pct": rng.uniform(0, 95),
        "fault_type": rng.choice(fault_types),
    }

def get_features_at_life_pct(life_pct):
    if avg_template is None:
        return {"rms_rm_norm": 1.0, "kurtosis_rm_norm": 1.0}
    idx = int(np.clip(life_pct / 100 * (len(avg_template) - 1), 0, len(avg_template) - 1))
    row = {}
    for col in feature_cols:
        mean_val = avg_template[col].iloc[idx]
        std_val = std_template[col].iloc[idx]
        row[col] = mean_val + rng.normal(0, std_val * NOISE_SCALE)
    return row

def tick_machine(state):
    dataset = state["dataset_type"]
    state["life_pct"] += LIFE_STEP_PCT
    
    fault_types = FAULT_TYPES_BEARING if dataset == "bearing" else FAULT_TYPES_CMAPSS
    
    if state["life_pct"] >= 100:
        state["life_pct"] = 0.0
        state["fault_type"] = rng.choice(fault_types)

    if dataset == "bearing":
        if bearing_model is not None:
            features = get_features_at_life_pct(state["life_pct"])
            X = pd.DataFrame([features])[feature_cols]
            risk_proba = float(bearing_model.predict_proba(X)[0, 1])
        else:
            risk_proba = (state["life_pct"] / 100) ** 3
    else: # cmapss mock degradation
        # Exponential degradation curve for Jet Engines
        normalized = np.clip(state["life_pct"] / 100.0, 0.0, 1.0)
        risk_proba = normalized ** 4 + rng.normal(0, 0.05)
        risk_proba = float(np.clip(risk_proba, 0.0, 1.0))

    status = "healthy" if risk_proba < RISK_THRESHOLD else "at_risk"

    return {
        "id": state["id"],
        "dataset_type": dataset,
        "display_name": state["id"],
        "status": status,
        "risk_probability": risk_proba,
        "life_pct": float(state["life_pct"]),
        "fault_type": state["fault_type"],
        "top_shap_feature": None,
    }

def tick_all_machines(dataset_type):
    results = []
    for machine_id, state in machines_state[dataset_type].items():
        result = tick_machine(state)
        try:
            supabase.table("machines").upsert(result).execute()
        except Exception as e:
            print(f"[tick_all_machines] {dataset_type} Supabase write failed for {machine_id}: {e}")
        results.append(result)
    return results

def set_agent_status(agent_name: str, state: str, dataset_type: str, machine_id: str | None = None):
    try:
        # Construct composite ID for PK if needed, but table might not have one.
        # Actually, agent_status usually has agent_name as PK. If we add dataset_type, we need to upsert by both.
        # We'll just upsert and hope the unique constraint includes dataset_type, or we might need to change it.
        # Wait, if agent_status uses agent_name as PK, upserting will overwrite the other dataset's agent status!
        # We must include dataset_type in the upsert.
        supabase.table("agent_status").upsert({
            "agent_name": agent_name,
            "dataset_type": dataset_type,
            "current_state": state,
            "current_machine_id": machine_id,
            "last_updated": datetime.utcnow().isoformat(),
        }).execute()
    except Exception as e:
        print(f"[set_agent_status] {dataset_type} failed for {agent_name}: {e}")

def log_event(machine_id: str, event_type: str, message: str, dataset_type: str, agent_name: str | None = None):
    try:
        supabase.table("events").insert({
            "sim_timestamp": datetime.utcnow().isoformat(),
            "machine_id": machine_id,
            "dataset_type": dataset_type,
            "event_type": event_type,
            "message": message,
            "agent_name": agent_name,
        }).execute()
    except Exception as e:
        print(f"[log_event] {dataset_type} failed for {machine_id}: {e}")

def monitoring_node(tick_results: list[dict], dataset_type: str):
    set_agent_status("monitoring", "working", dataset_type)
    for result in tick_results:
        machine_id = result["id"]
        is_at_risk = result["status"] == "at_risk"

        if is_at_risk and machine_id not in _already_flagged[dataset_type]:
            _already_flagged[dataset_type].add(machine_id)
            log_event(
                machine_id=machine_id,
                event_type="risk_detected",
                message=f"{machine_id} crossed risk threshold (p={result['risk_probability']:.2f})",
                dataset_type=dataset_type,
                agent_name="monitoring",
            )
            print(f"[monitoring] {dataset_type} {machine_id} flagged as at_risk")

        elif not is_at_risk and machine_id in _already_flagged[dataset_type]:
            _already_flagged[dataset_type].discard(machine_id)

    set_agent_status("monitoring", "idle", dataset_type)

# ---- Stage 4: Planning Node ----
REPAIR_DURATION_TICKS = 5

def get_available_crew(dataset_type: str):
    try:
        res = supabase.table("crews").select("*").eq("dataset_type", dataset_type).eq("status", "available").limit(1).execute()
        if res.data:
            return res.data[0]
        return None
    except Exception as e:
        print(f"[get_available_crew] {dataset_type} failed: {e}")
        return None

def dispatch_crew(crew_id: str, machine_id: str, dataset_type: str):
    try:
        supabase.table("crews").update({
            "status": "dispatched",
            "assigned_machine_id": machine_id,
            "eta_sim_hours": REPAIR_DURATION_TICKS,
            "last_updated": datetime.utcnow().isoformat(),
        }).eq("id", crew_id).eq("dataset_type", dataset_type).execute()
        _active_repairs[dataset_type][machine_id] = {"crew_id": crew_id, "ticks_remaining": REPAIR_DURATION_TICKS}
    except Exception as e:
        print(f"[dispatch_crew] {dataset_type} failed: {e}")

def free_crew(crew_id: str, dataset_type: str):
    try:
        supabase.table("crews").update({
            "status": "available",
            "assigned_machine_id": None,
            "eta_sim_hours": None,
            "last_updated": datetime.utcnow().isoformat(),
        }).eq("id", crew_id).eq("dataset_type", dataset_type).execute()
    except Exception as e:
        print(f"[free_crew] {dataset_type} failed: {e}")

def planning_node(tick_results: list[dict], dataset_type: str):
    set_agent_status("planning", "working", dataset_type)

    for result in tick_results:
        machine_id = result["id"]
        is_at_risk = result["status"] == "at_risk"

        already_being_repaired = machine_id in _active_repairs[dataset_type]
        if is_at_risk and not already_being_repaired:
            crew = get_available_crew(dataset_type)
            if crew:
                dispatch_crew(crew["id"], machine_id, dataset_type)
                log_event(machine_id, "crew_dispatched",
                          f"{crew['id']} dispatched to {machine_id}", dataset_type, agent_name="planning")
                print(f"[planning] {dataset_type} {crew['id']} -> {machine_id}")
            else:
                log_event(machine_id, "queued_no_crew",
                          f"{machine_id} at risk but no crew available", dataset_type, agent_name="planning")
                print(f"[planning] {dataset_type} {machine_id} queued")

    completed = []
    for machine_id, repair in _active_repairs[dataset_type].items():
        repair["ticks_remaining"] -= 1
        if repair["ticks_remaining"] <= 0:
            completed.append(machine_id)

    for machine_id in completed:
        crew_id = _active_repairs[dataset_type][machine_id]["crew_id"]
        free_crew(crew_id, dataset_type)
        log_event(machine_id, "repair_complete",
                  f"{crew_id} completed repair on {machine_id}", dataset_type, agent_name="planning")
        print(f"[planning] {dataset_type} repair complete: {machine_id}")
        del _active_repairs[dataset_type][machine_id]
        _already_flagged[dataset_type].discard(machine_id)

    set_agent_status("planning", "idle", dataset_type)


# ---- Stage 5: Diagnosis Node ----
_project_endpoint = os.environ.get("AZURE_AI_ENDPOINT", "")
if _project_endpoint:
    _base_url = _project_endpoint.split("/api/")[0]
    AZURE_INFERENCE_ENDPOINT = f"{_base_url}/models"
    AZURE_AI_KEY = os.environ.get("AZURE_AI_KEY", "")
    AZURE_AI_DEPLOYMENT = os.environ.get("AZURE_AI_DEPLOYMENT", "gpt-4.1-mini")
    _chat_client = ChatCompletionsClient(
        endpoint=AZURE_INFERENCE_ENDPOINT,
        credential=AzureKeyCredential(AZURE_AI_KEY),
    )
else:
    _chat_client = None


async def generate_diagnosis_text_async(machine_id: str, risk_probability: float, fault_type: str, dataset_type: str):
    set_agent_status("diagnosis", "working", dataset_type, machine_id)
    try:
        history_res = supabase.table("events").select("*") \
            .eq("machine_id", machine_id).eq("dataset_type", dataset_type).order("created_at", desc=True).limit(10).execute()
        history = history_res.data or []
    except Exception as e:
        history = []

    past_risk_count = sum(1 for e in history if e["event_type"] == "risk_detected")
    past_failure_count = sum(1 for e in history if e["event_type"] == "failure_occurred")

    machine_type = "Jet Engine" if dataset_type == "cmapss" else "Bearing"

    prompt = (
        f"{machine_type} {machine_id} has crossed its risk threshold "
        f"(risk probability: {risk_probability:.2f}, simulated fault type: {fault_type.replace('_', ' ')}). "
        f"History: this machine has been flagged as at-risk {past_risk_count} time(s) before, "
        f"and had {past_failure_count} unplanned failure(s) in its recorded history. "
        f"Write ONE short sentence (max 25 words) for a maintenance technician: explain the current "
        f"risk AND note if this looks like a recurring/pattern issue versus a first-time event."
    )
    
    diagnosis_text = f"{machine_id}: risk detected ({fault_type.replace('_', ' ')})."
    if _chat_client:
        try:
            response = await asyncio.to_thread(
                _chat_client.complete,
                model=AZURE_AI_DEPLOYMENT,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=70,
            )
            diagnosis_text = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[generate_diagnosis_text_async] LLM call failed: {e}")

    log_event(machine_id, "diagnosis_complete", diagnosis_text, dataset_type, agent_name="diagnosis")
    print(f"[diagnosis] {dataset_type} {machine_id}: {diagnosis_text}")
    set_agent_status("diagnosis", "idle", dataset_type)


def diagnosis_node(tick_results: list[dict], dataset_type: str):
    for result in tick_results:
        machine_id = result["id"]
        is_at_risk = result["status"] == "at_risk"

        if is_at_risk and machine_id not in _already_diagnosed[dataset_type]:
            _already_diagnosed[dataset_type].add(machine_id)
            asyncio.create_task(
                generate_diagnosis_text_async(machine_id, result["risk_probability"], result["fault_type"], dataset_type)
            )
        elif not is_at_risk and machine_id in _already_diagnosed[dataset_type]:
            _already_diagnosed[dataset_type].discard(machine_id)

# ---- Stage 6: Reporting Node ----
TP_VALUE = 50000
FP_COST = -5000
FN_COST = -80000

def compute_month_metrics(events: list[dict]):
    planned_count = sum(1 for e in events if e["event_type"] == "repair_complete")
    unplanned_count = sum(1 for e in events if e["event_type"] == "failure_occurred")
    queued_count = sum(1 for e in events if e["event_type"] == "queued_no_crew")

    total_downtime_cost = unplanned_count * abs(FN_COST) + queued_count * abs(FP_COST)
    total_value_preserved = planned_count * TP_VALUE
    net_value = total_value_preserved - total_downtime_cost

    return {
        "total_events": len(events),
        "planned_count": planned_count,
        "unplanned_count": unplanned_count,
        "queued_count": queued_count,
        "total_downtime_cost": total_downtime_cost,
        "total_value_preserved": total_value_preserved,
        "net_value": net_value,
    }

async def reporting_node(dataset_type: str):
    set_agent_status("reporting", "working", dataset_type)

    try:
        res = supabase.table("events").select("*").eq("dataset_type", dataset_type).execute()
        events = res.data or []
    except Exception as e:
        events = []

    metrics = compute_month_metrics(events)

    try:
        past_res = supabase.table("monthly_reports").select("*") \
            .eq("dataset_type", dataset_type).order("month_number", desc=True).limit(2).execute()
        past_reports = past_res.data or []
    except Exception as e:
        past_reports = []

    trend_context = "No prior months available for comparison."
    if past_reports:
        prev = past_reports[0]
        trend_context = (
            f"Previous month had {prev['planned_count']} planned and {prev['unplanned_count']} "
            f"unplanned events, net value ${prev['net_value']:,}."
        )

    month_num = _current_month_number[dataset_type]
    prompt = (
        f"Monthly {dataset_type} fleet maintenance report, month {month_num}: "
        f"{metrics['planned_count']} planned repairs, {metrics['unplanned_count']} unplanned failures, "
        f"{metrics['queued_count']} machines queued without an available crew. "
        f"Net simulated value this month: ${metrics['net_value']:,}. "
        f"{trend_context} "
        f"Write a short (max 45 words) executive summary that includes a comparison to the previous "
        f"month if data is available."
    )
    
    summary_text = f"Month {month_num}: {metrics['planned_count']} planned, {metrics['unplanned_count']} unplanned. Net value: ${metrics['net_value']:,}."
    
    if _chat_client:
        try:
            response = await asyncio.to_thread(
                _chat_client.complete,
                model=AZURE_AI_DEPLOYMENT,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=110,
            )
            summary_text = response.choices[0].message.content.strip()
        except Exception as e:
            pass

    try:
        supabase.table("monthly_reports").insert({
            "month_number": month_num,
            "dataset_type": dataset_type,
            "total_events": metrics["total_events"],
            "planned_count": metrics["planned_count"],
            "unplanned_count": metrics["unplanned_count"],
            "total_downtime_cost": metrics["total_downtime_cost"],
            "total_value_preserved": metrics["total_value_preserved"],
            "net_value": metrics["net_value"],
            "detail_json": {"summary": summary_text, **metrics},
        }).execute()
        print(f"[reporting] {dataset_type} Month {month_num} report saved.")
    except Exception as e:
        pass

    _current_month_number[dataset_type] += 1
    set_agent_status("reporting", "idle", dataset_type)


# ---- Background loops ----
async def simulation_loop(dataset_type: str):
    prefix = "M" if dataset_type == "bearing" else "JE"
    machines_state[dataset_type] = {f"{prefix}{i+1:02d}": init_machine_state(f"{prefix}{i+1:02d}", dataset_type) for i in range(N_MACHINES)}
    print(f"Initialized {N_MACHINES} {dataset_type} machines.")
    
    # Initialize Crews if they don't exist
    try:
        res = supabase.table("crews").select("*").eq("dataset_type", dataset_type).execute()
        if not res.data or len(res.data) < 3:
            for i in range(3):
                supabase.table("crews").upsert({
                    "id": f"Crew-{dataset_type[:3].upper()}-{i+1}",
                    "dataset_type": dataset_type,
                    "status": "available"
                }).execute()
    except Exception as e:
        print(f"Failed to init crews for {dataset_type}: {e}")
    
    try:
        res = supabase.table("monthly_reports").select("month_number").eq("dataset_type", dataset_type).order("month_number", desc=True).limit(1).execute()
        if res.data:
            _current_month_number[dataset_type] = res.data[0]["month_number"] + 1
    except Exception as e:
        pass

    loop_count = 0
    while True:
        try:
            tick_results = tick_all_machines(dataset_type)
            monitoring_node(tick_results, dataset_type)
            diagnosis_node(tick_results, dataset_type)
            planning_node(tick_results, dataset_type)
            
            loop_count += 1
            if loop_count >= 30:
                asyncio.create_task(reporting_node(dataset_type))
                loop_count = 0
                
        except Exception as e:
            print(f"[simulation_loop] {dataset_type} tick error: {e}")
        await asyncio.sleep(TICK_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task1 = asyncio.create_task(simulation_loop("bearing"))
    task2 = asyncio.create_task(simulation_loop("cmapss"))
    yield
    task1.cancel()
    task2.cancel()

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}

@app.post("/trigger-monthly-report")
async def trigger_monthly_report(dataset_type: str = "bearing"):
    await reporting_node(dataset_type)
    return {"status": "report generated"}
