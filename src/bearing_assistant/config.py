# -*- coding: utf-8 -*-
"""
Bearing Assistant Configuration
Centralized configuration: reads environment variables and defines fixed model parameters.
"""
import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# ---- Groq Model & Parameters (Fixed standard) ----
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = "openai/gpt-oss-20b"
GROQ_REASONING_EFFORT = "low"
GROQ_MAX_COMPLETION_TOKENS = 1200
GROQ_MAX_CONTEXT_TOKENS = 8192

# ---- Data Paths ----
DATA_DIR = os.path.join(BASE_DIR, "data", "bearing_knowledge")
ASSETS_PATH = os.path.join(DATA_DIR, "bearing_assets.json")
CATALOG_PATH = os.path.join(DATA_DIR, "bearing_fault_catalog.json")
HISTORY_PATH = os.path.join(DATA_DIR, "bearing_maintenance_history.json")
MANUAL_PATH = os.path.join(DATA_DIR, "bearing_technical_manual.md")

# ---- Fallback Azure (if needed) ----
AZURE_AI_ENDPOINT = os.environ.get("AZURE_AI_ENDPOINT", "")
AZURE_AI_KEY = os.environ.get("AZURE_AI_KEY", "")
AZURE_AI_DEPLOYMENT = os.environ.get("AZURE_AI_DEPLOYMENT", "gpt-4.1-mini")
