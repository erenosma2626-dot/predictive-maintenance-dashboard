# -*- coding: utf-8 -*-
"""
Predictive Maintenance Fleet Simulation API & Copilot Gateway
FastAPI Application Entry Point with LangGraph Orchestration
"""
import os
import sys
import asyncio
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langgraph.types import Command

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from config import (
    N_MACHINES,
    TICK_INTERVAL_SECONDS,
    supabase,
    is_manual_crew_mode_enabled,
    is_human_approval_enabled,
)
from simulation_engine import (
    simulation_paused,
    machines_state,
    active_repairs,
    current_month_number,
    init_machine_state,
    tick_all_machines,
    dispatch_crew,
    log_event,
    REPAIR_DURATION_TICKS,
)
from graph import (
    SimulationState,
    build_simulation_graph,
    reporting_node,
)
from src.bearing_assistant.router import router as bearing_assistant_router

simulation_graph = build_simulation_graph()


# ---- Background Simulation Loop ----
async def simulation_loop(dataset_type: str):
    prefix = "M" if dataset_type == "bearing" else "JE"
    machines_state[dataset_type] = {
        f"{prefix}{i+1:02d}": init_machine_state(f"{prefix}{i+1:02d}", dataset_type)
        for i in range(N_MACHINES)
    }

    # Initialize Crews if needed
    if supabase:
        try:
            res = supabase.table("crews").select("*").eq("dataset_type", dataset_type).execute()
            if not res.data or len(res.data) < 3:
                for i in range(3):
                    supabase.table("crews").upsert({
                        "id": f"Crew-{dataset_type[:3].upper()}-{i+1}",
                        "dataset_type": dataset_type,
                        "status": "available",
                    }).execute()
            else:
                for c in res.data:
                    if c.get("status") == "dispatched" and c.get("assigned_machine_id"):
                        active_repairs[dataset_type][c["assigned_machine_id"]] = {
                            "crew_id": c["id"],
                            "ticks_remaining": c.get("eta_sim_hours", 5),
                        }
        except Exception as e:
            print(f"Failed to sync crews for {dataset_type}: {e}")

        try:
            res = supabase.table("monthly_reports").select("month_number").eq("dataset_type", dataset_type).order("month_number", desc=True).limit(1).execute()
            if res.data:
                current_month_number[dataset_type] = res.data[0]["month_number"] + 1
        except Exception:
            pass

    loop_count = 0
    while True:
        try:
            if simulation_paused.get(dataset_type, False):
                await asyncio.sleep(TICK_INTERVAL_SECONDS)
                continue

            config = {"configurable": {"thread_id": dataset_type}}
            state = simulation_graph.get_state(config)
            is_paused = False
            if state.next:
                for task in state.tasks:
                    if task.interrupts:
                        is_paused = True
                        break

            if is_paused and not is_human_approval_enabled():
                await simulation_graph.ainvoke(Command(resume={"approved": True}), config=config)
                is_paused = False

            tick_results = tick_all_machines(dataset_type)

            if not is_paused:
                initial_state: SimulationState = {
                    "tick_results": tick_results,
                    "current_machine_id": None,
                    "dataset_type": dataset_type,
                }
                await simulation_graph.ainvoke(initial_state, config=config)

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

# Mount Bearing Assistant Router (RAG Chatbot, Solution Evaluator, Manual Dispatch)
app.include_router(bearing_assistant_router)


# ---- REST Routes ----
@app.get("/api/settings/manual-crew-mode/{dataset_type}")
def get_manual_crew_mode(dataset_type: str):
    enabled = is_manual_crew_mode_enabled(dataset_type)
    return {"dataset_type": dataset_type, "manual_crew_mode": enabled}


@app.post("/api/settings/manual-crew-mode/{dataset_type}")
def set_manual_crew_mode(dataset_type: str, enabled: bool):
    if supabase:
        try:
            supabase.table("app_settings").upsert({
                "key": f"manual_crew_mode_{dataset_type}",
                "value": "true" if enabled else "false",
            }).execute()
            return {"dataset_type": dataset_type, "manual_crew_mode": enabled}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    return {"dataset_type": dataset_type, "manual_crew_mode": enabled}


@app.get("/api/simulation/pause/{dataset_type}")
def get_simulation_paused(dataset_type: str):
    return {"dataset_type": dataset_type, "paused": simulation_paused.get(dataset_type, False)}


@app.post("/api/simulation/pause/{dataset_type}")
def set_simulation_paused(dataset_type: str, paused: bool):
    simulation_paused[dataset_type] = paused
    return {"dataset_type": dataset_type, "paused": paused}


@app.api_route("/", methods=["GET", "HEAD"])
def health_check():
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}


@app.post("/trigger-monthly-report")
async def trigger_monthly_report(dataset_type: str = "bearing"):
    await reporting_node(dataset_type)
    return {"status": "report generated"}


@app.get("/pending-approvals/{dataset_type}")
async def get_pending_approvals(dataset_type: str):
    config = {"configurable": {"thread_id": dataset_type}}
    state = simulation_graph.get_state(config)
    if state.next:
        for task in state.tasks:
            if task.interrupts:
                return {"pending": True, "details": task.interrupts[0].value}
    return {"pending": False}


@app.post("/approve-dispatch/{dataset_type}")
async def approve_dispatch(dataset_type: str, approved: bool):
    config = {"configurable": {"thread_id": dataset_type}}
    await simulation_graph.ainvoke(Command(resume={"approved": approved}), config=config)
    return {"status": "resumed", "approved": approved}