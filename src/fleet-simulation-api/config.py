# -*- coding: utf-8 -*-
"""
Fleet Simulation Configuration & Database Client
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
load_dotenv(os.path.join(BASE_DIR, ".env"))

# ---- Simulation Constants ----
MODELS_DIR = os.path.join(BASE_DIR, "models")
N_MACHINES = 12
LIFE_STEP_PCT = 0.5
NOISE_SCALE = 0.3
TICK_INTERVAL_SECONDS = 3
RISK_THRESHOLD = 0.75
REPAIR_DURATION_TICKS = 5

# Financial Cost Model Constants
TP_VALUE = 50000
FP_COST = -5000
FN_COST = -80000

FAULT_TYPES_BEARING = ["inner_race", "outer_race", "roller_element"]
FAULT_TYPES_CMAPSS = ["HPC_Degradation", "LPT_Degradation", "Fan_Degradation"]

# ---- Supabase Client ----
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY", "")
supabase: Optional[Client] = create_client(SUPABASE_URL, SUPABASE_KEY) if (SUPABASE_URL and SUPABASE_KEY) else None


def is_manual_crew_mode_enabled(dataset_type: str = "bearing") -> bool:
    if not supabase:
        return False
    try:
        res = supabase.table("app_settings").select("value").eq("key", f"manual_crew_mode_{dataset_type}").execute()
        if not res.data:
            res = supabase.table("app_settings").select("value").eq("key", "manual_crew_mode").execute()
        if res.data:
            return res.data[0]["value"] == "true"
        return False
    except Exception as e:
        print(f"[is_manual_crew_mode_enabled] check failed: {e}")
        return False


def is_human_approval_enabled() -> bool:
    if not supabase:
        return False
    try:
        res = supabase.table("app_settings").select("value").eq("key", "human_approval_enabled").execute()
        if res.data:
            return res.data[0]["value"] == "true"
        return False
    except Exception as e:
        print(f"[is_human_approval_enabled] check failed: {e}")
        return False
