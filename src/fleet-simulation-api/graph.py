# -*- coding: utf-8 -*-
"""
LangGraph Multi-Agent StateGraph Workflow for Fleet Simulation
"""
import asyncio
from typing import TypedDict, Optional, List, Dict, Any
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt

from config import (
    TP_VALUE,
    FP_COST,
    FN_COST,
    FAULT_TYPES_BEARING,
    FAULT_TYPES_CMAPSS,
    supabase,
    is_manual_crew_mode_enabled,
    is_human_approval_enabled,
)
from simulation_engine import (
    rng,
    machines_state,
    already_flagged,
    active_repairs,
    already_diagnosed,
    current_month_number,
    set_agent_status,
    log_event,
    get_available_crew,
    dispatch_crew,
    free_crew,
)
from llm_services import (
    _chat_client,
    AZURE_AI_DEPLOYMENT,
    generate_diagnosis_text_async,
    generate_escalation_text_async,
    is_recurring_issue,
)


class SimulationState(TypedDict):
    tick_results: List[Dict[str, Any]]
    current_machine_id: Optional[str]
    dataset_type: str


def monitoring_node_lg(state: SimulationState) -> SimulationState:
    dataset_type = state["dataset_type"]
    set_agent_status("monitoring", "working", dataset_type=dataset_type)

    for result in state["tick_results"]:
        machine_id = result["id"]
        is_at_risk = result["status"] == "at_risk"

        if is_at_risk and machine_id not in already_flagged[dataset_type]:
            already_flagged[dataset_type].add(machine_id)
            log_event(
                machine_id=machine_id,
                event_type="risk_detected",
                message=f"{machine_id} crossed risk threshold (p={result['risk_probability']:.2f})",
                agent_name="monitoring",
                dataset_type=dataset_type,
            )
        elif not is_at_risk and machine_id in already_flagged[dataset_type] and result["life_pct"] < 5.0:
            already_flagged[dataset_type].discard(machine_id)

    set_agent_status("monitoring", "idle", dataset_type=dataset_type)
    return state


def planning_node_lg(state: SimulationState) -> SimulationState:
    dataset_type = state["dataset_type"]
    set_agent_status("planning", "working", dataset_type=dataset_type)

    for result in state["tick_results"]:
        machine_id = result["id"]
        is_at_risk = result["status"] == "at_risk"
        already_being_repaired = machine_id in active_repairs[dataset_type]

        if is_at_risk and not already_being_repaired:
            if is_manual_crew_mode_enabled(dataset_type):
                continue

            crew = get_available_crew(dataset_type)
            if crew:
                if is_human_approval_enabled():
                    approval = interrupt({
                        "action": "dispatch_crew",
                        "machine_id": machine_id,
                        "crew_id": crew["id"],
                        "dataset_type": dataset_type,
                    })
                    if not approval.get("approved", False):
                        log_event(
                            machine_id,
                            "dispatch_rejected",
                            f"Dispatch of {crew['id']} to {machine_id} was rejected",
                            agent_name="planning",
                            dataset_type=dataset_type,
                        )
                        continue

                dispatch_crew(crew["id"], machine_id, dataset_type)
                log_event(
                    machine_id,
                    "crew_dispatched",
                    f"{crew['id']} dispatched to {machine_id}",
                    agent_name="planning",
                    dataset_type=dataset_type,
                )
            else:
                log_event(
                    machine_id,
                    "queued_no_crew",
                    f"{machine_id} at risk but no crew available",
                    agent_name="planning",
                    dataset_type=dataset_type,
                )

    completed = []
    for machine_id, repair in list(active_repairs[dataset_type].items()):
        repair["ticks_remaining"] -= 1
        if repair["ticks_remaining"] <= 0:
            completed.append(machine_id)

    for machine_id in completed:
        crew_id = active_repairs[dataset_type][machine_id]["crew_id"]
        free_crew(crew_id, dataset_type)

        if machine_id in machines_state[dataset_type]:
            machines_state[dataset_type][machine_id]["life_pct"] = 0.0
            fault_types = FAULT_TYPES_BEARING if dataset_type == "bearing" else FAULT_TYPES_CMAPSS
            machines_state[dataset_type][machine_id]["fault_type"] = rng.choice(fault_types)

        log_event(
            machine_id,
            "repair_complete",
            f"{crew_id} completed repair on {machine_id}",
            agent_name="planning",
            dataset_type=dataset_type,
        )
        del active_repairs[dataset_type][machine_id]
        already_flagged[dataset_type].discard(machine_id)

    set_agent_status("planning", "idle", dataset_type=dataset_type)
    return state


async def diagnosis_node_lg(state: SimulationState) -> SimulationState:
    dataset_type = state["dataset_type"]

    for result in state["tick_results"]:
        machine_id = result["id"]
        is_at_risk = result["status"] == "at_risk"

        if is_at_risk and machine_id not in already_diagnosed[dataset_type]:
            already_diagnosed[dataset_type].add(machine_id)
            await generate_diagnosis_text_async(
                machine_id, result["risk_probability"], result["fault_type"], dataset_type
            )
        elif not is_at_risk and machine_id in already_diagnosed[dataset_type]:
            already_diagnosed[dataset_type].discard(machine_id)

    return state


async def escalation_node_lg(state: SimulationState) -> SimulationState:
    dataset_type = state["dataset_type"]

    for result in state["tick_results"]:
        machine_id = result["id"]
        is_at_risk = result["status"] == "at_risk"

        if is_at_risk and machine_id not in already_diagnosed[dataset_type]:
            already_diagnosed[dataset_type].add(machine_id)
            await generate_escalation_text_async(
                machine_id, result["risk_probability"], result["fault_type"], dataset_type
            )
        elif not is_at_risk and machine_id in already_diagnosed[dataset_type]:
            already_diagnosed[dataset_type].discard(machine_id)

    return state


def route_after_monitoring(state: SimulationState) -> str:
    dataset_type = state["dataset_type"]
    for result in state["tick_results"]:
        if result["status"] == "at_risk" and is_recurring_issue(result["id"], dataset_type):
            return "escalation"
    return "diagnosis"


def compute_month_metrics(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    planned_count = sum(1 for e in events if e.get("event_type") == "repair_complete")
    unplanned_count = sum(1 for e in events if e.get("event_type") == "failure_occurred")
    queued_count = sum(1 for e in events if e.get("event_type") == "queued_no_crew")

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
    events = []
    if supabase:
        try:
            res = supabase.table("events").select("*").eq("dataset_type", dataset_type).execute()
            events = res.data or []
        except Exception:
            events = []

    metrics = compute_month_metrics(events)
    past_reports = []
    if supabase:
        try:
            past_res = supabase.table("monthly_reports").select("*") \
                .eq("dataset_type", dataset_type).order("month_number", desc=True).limit(2).execute()
            past_reports = past_res.data or []
        except Exception:
            past_reports = []

    trend_context = "No prior months available for comparison."
    if past_reports:
        prev = past_reports[0]
        trend_context = (
            f"Previous month had {prev['planned_count']} planned and {prev['unplanned_count']} "
            f"unplanned events, net value ${prev['net_value']:,}."
        )

    month_num = current_month_number[dataset_type]
    prompt = (
        f"Monthly {dataset_type} fleet maintenance report, month {month_num}: "
        f"{metrics['planned_count']} planned repairs, {metrics['unplanned_count']} unplanned failures, "
        f"{metrics['queued_count']} machines queued without an available crew. "
        f"Net simulated value this month: ${metrics['net_value']:,}. "
        f"{trend_context} "
        f"Write a short (max 45 words) executive summary that includes a comparison to the previous month if data is available."
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
        except Exception:
            pass

    if supabase:
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
        except Exception:
            pass

    current_month_number[dataset_type] += 1
    set_agent_status("reporting", "idle", dataset_type)


def build_simulation_graph():
    graph = StateGraph(SimulationState)

    graph.add_node("monitoring", monitoring_node_lg)
    graph.add_node("diagnosis", diagnosis_node_lg)
    graph.add_node("escalation", escalation_node_lg)
    graph.add_node("planning", planning_node_lg)

    graph.set_entry_point("monitoring")
    graph.add_conditional_edges(
        "monitoring",
        route_after_monitoring,
        {"diagnosis": "diagnosis", "escalation": "escalation"}
    )
    graph.add_edge("diagnosis", "planning")
    graph.add_edge("escalation", "planning")
    graph.add_edge("planning", END)

    checkpointer = MemorySaver()
    return graph.compile(checkpointer=checkpointer)
