# -*- coding: utf-8 -*-
"""
Simulation Physics Engine, State Tracking & Dispatch Mechanics
"""
import os
import pickle
import warnings
from datetime import datetime
from typing import Optional, Dict, Any, Set
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore", category=UserWarning)

from config import (
    MODELS_DIR,
    N_MACHINES,
    LIFE_STEP_PCT,
    NOISE_SCALE,
    RISK_THRESHOLD,
    REPAIR_DURATION_TICKS,
    FAULT_TYPES_BEARING,
    FAULT_TYPES_CMAPSS,
    supabase,
)

# ---- Load Bearing model + templates ----
bearing_model = None
avg_template = None
std_template = None

try:
    with open(os.path.join(MODELS_DIR, "bearing_model.pkl"), "rb") as f:
        bearing_model = pickle.load(f)
    avg_template = pd.read_csv(os.path.join(MODELS_DIR, "bearing_avg_template.csv"))
    std_template = pd.read_csv(os.path.join(MODELS_DIR, "bearing_std_template.csv"))
except Exception as e:
    print(f"Warning: Could not load bearing model/templates: {e}")

feature_cols = ["rms_rm_norm", "kurtosis_rm_norm"]

# ---- Simulation State ----
rng = np.random.default_rng()

simulation_paused: Dict[str, bool] = {"bearing": False, "cmapss": False}
machines_state: Dict[str, Dict[str, Any]] = {"bearing": {}, "cmapss": {}}
already_flagged: Dict[str, Set[str]] = {"bearing": set(), "cmapss": set()}
active_repairs: Dict[str, Dict[str, Any]] = {"bearing": {}, "cmapss": {}}
already_diagnosed: Dict[str, Set[str]] = {"bearing": set(), "cmapss": set()}
current_month_number: Dict[str, int] = {"bearing": 1, "cmapss": 1}


def init_machine_state(machine_id: str, dataset_type: str) -> Dict[str, Any]:
    fault_types = FAULT_TYPES_BEARING if dataset_type == "bearing" else FAULT_TYPES_CMAPSS
    return {
        "id": machine_id,
        "dataset_type": dataset_type,
        "life_pct": rng.uniform(0, 95),
        "fault_type": rng.choice(fault_types),
    }


def get_features_at_life_pct(life_pct: float) -> Dict[str, float]:
    if avg_template is None or std_template is None:
        return {"rms_rm_norm": 1.0, "kurtosis_rm_norm": 1.0}
    idx = int(np.clip(life_pct / 100 * (len(avg_template) - 1), 0, len(avg_template) - 1))
    row = {}
    for col in feature_cols:
        mean_val = avg_template[col].iloc[idx]
        std_val = std_template[col].iloc[idx]
        row[col] = mean_val + rng.normal(0, std_val * NOISE_SCALE)
    return row


def tick_machine(state: Dict[str, Any]) -> Dict[str, Any]:
    dataset = state["dataset_type"]
    state["life_pct"] += LIFE_STEP_PCT

    if state["life_pct"] >= 99.9:
        state["life_pct"] = 99.9

    if dataset == "bearing":
        if bearing_model is not None:
            features = get_features_at_life_pct(state["life_pct"])
            X = np.array([[features["rms_rm_norm"], features["kurtosis_rm_norm"]]], dtype=np.float32)
            risk_proba = float(bearing_model.predict_proba(X)[0, 1])
        else:
            risk_proba = (state["life_pct"] / 100) ** 3
    else:  # cmapss degradation curve
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


def tick_all_machines(dataset_type: str) -> list:
    results = []
    for machine_id, state in machines_state[dataset_type].items():
        if machine_id in active_repairs[dataset_type]:
            result = {
                "id": state["id"],
                "dataset_type": dataset_type,
                "display_name": state["id"],
                "status": "at_risk",
                "risk_probability": 0.99,
                "life_pct": float(state["life_pct"]),
                "fault_type": state["fault_type"],
                "top_shap_feature": None,
            }
        else:
            result = tick_machine(state)
        results.append(result)

    # 1 single bulk batch HTTP upsert for all machines instead of 12 individual roundtrips
    if supabase and results:
        try:
            supabase.table("machines").upsert(results).execute()
        except Exception as e:
            print(f"[tick_all_machines] {dataset_type} Bulk Supabase write failed: {e}")

    return results


def set_agent_status(agent_name: str, state: str, dataset_type: str, machine_id: Optional[str] = None):
    if not supabase:
        return
    try:
        supabase.table("agent_status").upsert({
            "agent_name": agent_name,
            "dataset_type": dataset_type,
            "current_state": state,
            "current_machine_id": machine_id,
            "last_updated": datetime.utcnow().isoformat(),
        }).execute()
    except Exception as e:
        print(f"[set_agent_status] {dataset_type} failed for {agent_name}: {e}")


def log_event(machine_id: str, event_type: str, message: str, dataset_type: str, agent_name: Optional[str] = None):
    if not supabase:
        return
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


def get_available_crew(dataset_type: str) -> Optional[Dict[str, Any]]:
    if not supabase:
        return None
    try:
        res = supabase.table("crews").select("*").eq("dataset_type", dataset_type).eq("status", "available").limit(1).execute()
        if res.data:
            return res.data[0]
        return None
    except Exception as e:
        print(f"[get_available_crew] {dataset_type} failed: {e}")
        return None


def dispatch_crew(crew_id: str, machine_id: str, dataset_type: str):
    if supabase:
        try:
            supabase.table("crews").update({
                "status": "dispatched",
                "assigned_machine_id": machine_id,
                "eta_sim_hours": REPAIR_DURATION_TICKS,
                "last_updated": datetime.utcnow().isoformat(),
            }).eq("id", crew_id).eq("dataset_type", dataset_type).execute()
        except Exception as e:
            print(f"[dispatch_crew] {dataset_type} failed: {e}")

    active_repairs[dataset_type][machine_id] = {
        "crew_id": crew_id,
        "ticks_remaining": REPAIR_DURATION_TICKS
    }


def free_crew(crew_id: str, dataset_type: str):
    if supabase:
        try:
            supabase.table("crews").update({
                "status": "available",
                "assigned_machine_id": None,
                "eta_sim_hours": None,
                "last_updated": datetime.utcnow().isoformat(),
            }).eq("id", crew_id).eq("dataset_type", dataset_type).execute()
        except Exception as e:
            print(f"[free_crew] {dataset_type} failed: {e}")
