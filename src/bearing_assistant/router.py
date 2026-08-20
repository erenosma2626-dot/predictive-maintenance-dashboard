# -*- coding: utf-8 -*-
"""
FastAPI Router for Bearing Assistant Endpoints
Clean, modular REST API that mounts directly onto fleet-simulation-api main.py.
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.bearing_assistant.rag import store, build_chat_user_prompt, SYSTEM_PROMPT_CHATBOT
from src.bearing_assistant.llm import call_groq
from src.bearing_assistant.evaluator import evaluate_solution

router = APIRouter(prefix="/api/bearing", tags=["Bearing Assistant"])


# --- Request/Response Models ---
class ChatRequest(BaseModel):
    question: str
    machine_id: Optional[str] = None
    fault_code: Optional[str] = None
    fault_type: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    resolved_asset: Optional[Dict[str, Any]] = None
    matched_faults: List[Dict[str, Any]] = []
    source_documents: List[str] = []


class VerifySolutionRequest(BaseModel):
    user_solution: str
    machine_id: str
    fault_code: Optional[str] = None
    fault_type: Optional[str] = None


class VerifySolutionResponse(BaseModel):
    is_correct: bool
    score: int
    feedback: str
    missing_steps: List[str]
    official_sop: Optional[str] = None


class ManualDispatchRequest(BaseModel):
    machine_id: str
    crew_id: str
    dataset_type: str = "bearing"


# --- Endpoints ---

@router.get("/health")
def bearing_health():
    return {
        "status": "online",
        "total_assets": len(store.assets),
        "total_fault_codes": len(store.fault_catalog),
        "total_history_records": len(store.history),
    }


@router.get("/assets")
def get_assets():
    return store.assets


@router.get("/fault-catalog")
def get_fault_catalog():
    return store.fault_catalog


@router.get("/history/{asset_id}")
def get_history_by_asset(asset_id: str):
    return store.get_history_for_asset(asset_id)


@router.post("/chat", response_model=ChatResponse)
def bearing_chat(req: ChatRequest):
    """
    Scene 2: Technical RAG assistant answering technician queries.
    """
    context = store.resolve_query_context(
        question=req.question,
        target_asset_id=req.machine_id,
        target_fault_code=req.fault_code,
    )

    user_prompt = build_chat_user_prompt(req.question, context)
    answer = call_groq(SYSTEM_PROMPT_CHATBOT, user_prompt)

    sources = ["STD-ENG-BRG-2026-V4 Rulman Mühendislik Kılavuzu"]
    if context.get("faults"):
        sources.extend([f"{f['fault_code']} Arıza Kataloğu" for f in context["faults"]])
    if context.get("asset"):
        sources.append(f"{context['asset']['asset_id']} Varlık Özellik Kartı")

    return ChatResponse(
        answer=answer,
        resolved_asset=context.get("asset"),
        matched_faults=context.get("faults", []),
        source_documents=sources,
    )


@router.post("/verify-solution", response_model=VerifySolutionResponse)
def verify_technician_solution(req: VerifySolutionRequest):
    """
    Scene 4: Evaluates user typed solution against official SOP.
    """
    if not req.user_solution or len(req.user_solution.strip()) < 3:
        return VerifySolutionResponse(
            is_correct=False,
            score=0,
            feedback="Lütfen uygulanacak onarım adımını yazınız.",
            missing_steps=["Onarım adımları girilmedi."],
            official_sop=None,
        )

    res = evaluate_solution(
        user_solution=req.user_solution,
        machine_id=req.machine_id,
        fault_code=req.fault_code,
        fault_type=req.fault_type,
    )
    return VerifySolutionResponse(**res)


@router.post("/manual-dispatch")
def manual_dispatch_crew(req: ManualDispatchRequest):
    """
    Scene 5: Manually dispatches chosen crew to repair at-risk machine.
    """
    from src.fleet_simulation_api import main as fleet_main
    try:
        fleet_main.dispatch_crew(
            crew_id=req.crew_id,
            machine_id=req.machine_id,
            dataset_type=req.dataset_type,
        )
        fleet_main.log_event(
            machine_id=req.machine_id,
            event_type="dispatch_approved",
            message=f"Manuel Operatör Sevk: {req.crew_id} -> {req.machine_id} onaylandı (5 tick onarım başladı).",
            dataset_type=req.dataset_type,
            agent_name="manual_operator",
        )
        return {
            "success": True,
            "message": f"{req.crew_id} başarıyla {req.machine_id} makinesine sevk edildi.",
            "ticks_remaining": fleet_main.REPAIR_DURATION_TICKS,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
