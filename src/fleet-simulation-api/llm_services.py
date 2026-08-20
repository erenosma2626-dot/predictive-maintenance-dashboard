# -*- coding: utf-8 -*-
"""
LLM Diagnostic & Escalation Services
"""
import os
import asyncio
from typing import Optional
from azure.ai.inference import ChatCompletionsClient
from azure.core.credentials import AzureKeyCredential

from config import supabase
from simulation_engine import set_agent_status, log_event

# ---- Initialize LLM Client ----
_project_endpoint = os.environ.get("AZURE_AI_ENDPOINT", "")
if _project_endpoint:
    _base_url = _project_endpoint.split("/api/")[0]
    AZURE_INFERENCE_ENDPOINT = f"{_base_url}/models"
    AZURE_AI_KEY = os.environ.get("AZURE_AI_KEY", "")
    AZURE_AI_DEPLOYMENT = os.environ.get("AZURE_AI_DEPLOYMENT", "gpt-4.1-mini")
    _chat_client: Optional[ChatCompletionsClient] = ChatCompletionsClient(
        endpoint=AZURE_INFERENCE_ENDPOINT,
        credential=AzureKeyCredential(AZURE_AI_KEY),
    )
else:
    _chat_client = None
    AZURE_AI_DEPLOYMENT = "gpt-4.1-mini"


def is_recurring_issue(machine_id: str, dataset_type: str, lookback: int = 20, threshold: int = 2) -> bool:
    """Returns True if machine had more than threshold risk_detected events in recent lookback window."""
    if not supabase:
        return False
    try:
        res = supabase.table("events").select("event_type") \
            .eq("machine_id", machine_id).eq("dataset_type", dataset_type) \
            .eq("event_type", "risk_detected") \
            .order("created_at", desc=True).limit(lookback).execute()
        count = len(res.data or [])
        return count > threshold
    except Exception as e:
        print(f"[is_recurring_issue] check failed for {machine_id}: {e}")
        return False


async def generate_diagnosis_text_async(machine_id: str, risk_probability: float, fault_type: str, dataset_type: str):
    set_agent_status("diagnosis", "working", dataset_type, machine_id)
    history = []
    if supabase:
        try:
            history_res = supabase.table("events").select("*") \
                .eq("machine_id", machine_id).eq("dataset_type", dataset_type).order("created_at", desc=True).limit(10).execute()
            history = history_res.data or []
        except Exception:
            history = []

    past_risk_count = sum(1 for e in history if e.get("event_type") == "risk_detected")
    past_failure_count = sum(1 for e in history if e.get("event_type") == "failure_occurred")

    machine_type = "Jet Engine" if dataset_type == "cmapss" else "Bearing"
    fault_label = fault_type.replace('_', ' ')

    prompt = (
        f"{machine_type} {machine_id} has crossed its risk threshold "
        f"(risk probability: {risk_probability:.2f}, simulated fault type: {fault_label}). "
        f"History: this machine has been flagged as at-risk {past_risk_count} time(s) before, "
        f"and had {past_failure_count} unplanned failure(s) in its recorded history. "
        f"Write ONE short sentence (max 25 words) for a maintenance technician: explain the current "
        f"risk AND note if this looks like a recurring/pattern issue versus a first-time event."
    )

    diagnosis_text = f"{machine_id}: risk detected ({fault_label})."
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
    set_agent_status("diagnosis", "idle", dataset_type)


async def generate_escalation_text_async(machine_id: str, risk_probability: float, fault_type: str, dataset_type: str):
    set_agent_status("diagnosis", "working", machine_id=None, dataset_type=dataset_type)
    fault_label = fault_type.replace('_', ' ')

    prompt = (
        f"Machine {machine_id} has crossed its risk threshold again "
        f"(risk probability: {risk_probability:.2f}, simulated fault type: {fault_label}). "
        f"This machine has been flagged as at-risk multiple times recently — this looks like a "
        f"RECURRING issue, not a one-off event. Write ONE short, more urgent sentence (max 25 words) "
        f"for a maintenance technician, explicitly flagging this as a likely persistent/underlying "
        f"problem that may need deeper inspection rather than a routine repair."
    )

    diagnosis_text = f"{machine_id}: RECURRING risk detected ({fault_label}), escalation diagnosis unavailable."
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
            print(f"[generate_escalation_text_async] LLM call failed: {e}")

    log_event(machine_id, "escalation_diagnosis_complete", diagnosis_text, agent_name="diagnosis", dataset_type=dataset_type)
    set_agent_status("diagnosis", "idle", dataset_type=dataset_type)
