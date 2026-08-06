import os
import json
import time
import asyncio
import random
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

SENSOR_NAMES = {
    "s_1": "Total Temp Fan Inlet",
    "s_2": "Total Temp LPC Outlet",
    "s_3": "Total Temp HPC Outlet",
    "s_4": "Total Temp LPT Outlet",
    "s_5": "Pressure Fan Inlet",
    "s_6": "Total Pressure Bypass",
    "s_7": "Total Pressure HPC Outlet",
    "s_8": "Physical Fan Speed",
    "s_9": "Physical Core Speed",
    "s_10": "Engine Pressure Ratio",
    "s_11": "Static Pressure HPC Outlet",
    "s_12": "Ratio Fuel Flow to Ps30",
    "s_13": "Corrected Fan Speed",
    "s_14": "Corrected Core Speed",
    "s_15": "Bypass Ratio",
    "s_16": "Burner Fuel-Air Ratio",
    "s_17": "Bleed Enthalpy",
    "s_18": "Demanded Fan Speed",
    "s_19": "Demanded Corrected Fan Speed",
    "s_20": "HPT Coolant Bleed",
    "s_21": "LPT Coolant Bleed"
}

def format_feature_name(feature_code):
    base_code = feature_code
    suffix = ""
    if feature_code.endswith("_trend"):
        base_code = feature_code.replace("_trend", "")
        suffix = " (Trend)"
    elif feature_code.endswith("_rm"):
        base_code = feature_code.replace("_rm", "")
        suffix = " (Rolling Mean)"
    elif feature_code.endswith("_dev"):
        base_code = feature_code.replace("_dev", "")
        suffix = " (Deviation)"
    
    real_name = SENSOR_NAMES.get(base_code, base_code)
    return f"{real_name}{suffix}"

# Try importing the real generator. If it fails due to missing data/model, we will fallback to mock.
try:
    import pickle
    import pandas as pd
    import shap
    import sys
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from src.synthetic.cmapss_generator import SyntheticEngineStreamWithExplain
    REAL_GENERATOR_AVAILABLE = True
except Exception as e:
    print(f"Could not load real generator dependencies: {e}")
    REAL_GENERATOR_AVAILABLE = False

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Supabase client initialized.")
    except Exception as e:
        print(f"Failed to initialize Supabase: {e}")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)
        for dead in dead_connections:
            self.disconnect(dead)

manager = ConnectionManager()

# Mock Generator Fallback
class MockGenerator:
    def __init__(self):
        self._start_new()
        
    def _start_new(self):
        self.engineId = random.randint(1, 100)
        self.totalLifespan = random.randint(130, 230)
        self.cycle = 1
        self.sensors = {
            "s_2": 641.8, "s_3": 1580.0, "s_4": 1390.0, "s_7": 554.0, "s_8": 2388.0, 
            "s_9": 9050.0, "s_11": 47.0, "s_12": 522.0, "s_13": 2388.0, "s_14": 8130.0, 
            "s_15": 8.4, "s_17": 391.0, "s_20": 38.9, "s_21": 23.3
        }
        self.featuresList = ['s_20_trend', 's_17_trend', 's_15_dev', 's_4_rm', 's_7_trend']

    def tick(self):
        if self.cycle >= self.totalLifespan:
            self._start_new()
        
        progress = self.cycle / self.totalLifespan
        probability = 0.01
        if progress > 0.85:
            probability = 0.01 + ((progress - 0.85) / 0.15)**3 * 0.98
        else:
            probability = 0.01 + ((progress) / 0.85)**2 * 0.2
            
        probability = min(max(probability, 0), 1)
        
        for k in self.sensors:
            jitter = (random.random() - 0.5) * (self.sensors[k] * 0.002)
            self.sensors[k] = round(self.sensors[k] + jitter, 2)
            
        topFeatures = [
            {"feature": random.choice(self.featuresList), "shap_value": round(-0.048 - (random.random() * 0.02), 3)},
            {"feature": random.choice(self.featuresList), "shap_value": round(0.045 + (random.random() * 0.02), 3)}
        ]
        
        riskLevel = "HIGH" if probability >= 0.7 else "MODERATE" if probability >= 0.3 else "LOW"
        
        primary_feat_name = format_feature_name(topFeatures[0]['feature'])
        secondary_feat_name = format_feature_name(topFeatures[1]['feature'])
        
        msg = f"ALERT — Engine SYN-{self.engineId}, Cycle {self.cycle}/{self.totalLifespan}\nRisk probability: {probability:.2f} ({riskLevel})\n\nPrimary contributing signal: {primary_feat_name} ({topFeatures[0]['shap_value']})\nSecondary: {secondary_feat_name}"
        
        res = {
            "engine_source_unit": self.engineId,
            "cycle": self.cycle,
            "engine_total_lifespan": self.totalLifespan,
            "sensors": self.sensors,
            "maintenance_flag": 1 if probability >= 0.5 else 0,
            "maintenance_probability": round(probability, 3),
            "explanation": {
                "top_features": topFeatures,
                "message": msg
            }
        }
        self.cycle += 1
        return res

# Setup generator
generator = None
if REAL_GENERATOR_AVAILABLE:
    try:
        # NOTE: This assumes the models and data exist in the expected paths during deployment.
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        with open(os.path.join(base_dir, 'models', 'cmapss_metadata.json'), 'r') as f:
            metadata = json.load(f)
        with open(os.path.join(base_dir, 'models', 'cmapss_model.pkl'), 'rb') as f:
            model = pickle.load(f)
        # We need a train_df to init the explainer and the stream. For now, we fallback to mock if this fails.
        train_df = pd.read_csv(os.path.join(base_dir, 'data', 'processed', 'train_FD001_processed.csv'))
        explainer = shap.TreeExplainer(model)
        
        sensors = [col for col in metadata["feature_columns"] if "_" not in col] # simplified extraction
        generator = SyntheticEngineStreamWithExplain(train_df, sensors, metadata["feature_columns"], model, explainer)
        print("Using REAL SyntheticEngineStreamWithExplain.")
    except Exception as e:
        print(f"Failed to load real model data, using MockGenerator. Error: {e}")
        generator = MockGenerator()
else:
    print("Using MockGenerator fallback.")
    generator = MockGenerator()

# Global state to keep track of the latest tick if Supabase is offline
current_tick_state = None

async def tick_loop():
    global current_tick_state
    while True:
        try:
            tick_data = generator.tick()
            current_tick_state = tick_data
            
            # Broadcast to websockets
            await manager.broadcast(tick_data)
            
            # Persist to Supabase
            if supabase:
                # 1. Update current_state (id=1)
                supabase.table('current_state').upsert({"id": 1, "state_data": tick_data}).execute()
                # 2. Insert into engine_history
                supabase.table('engine_history').insert({
                    "engine_source_unit": tick_data["engine_source_unit"],
                    "cycle": tick_data["cycle"],
                    "engine_total_lifespan": tick_data["engine_total_lifespan"],
                    "sensors": tick_data["sensors"],
                    "maintenance_flag": tick_data["maintenance_flag"],
                    "maintenance_probability": tick_data["maintenance_probability"],
                    "explanation": tick_data["explanation"]
                }).execute()
        except Exception as e:
            print(f"Error in tick loop: {e}")
            
        await asyncio.sleep(1) # 1Hz tick rate

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the background tick loop
    task = asyncio.create_task(tick_loop())
    yield
    # Shutdown
    task.cancel()

app = FastAPI(lifespan=lifespan)

# Allow CORS for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change this to the specific Vercel domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Predictive Maintenance API is running."}

@app.get("/current-state")
def get_current_state():
    if supabase:
        try:
            res = supabase.table('current_state').select('state_data').eq('id', 1).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]['state_data']
        except Exception as e:
            print("Supabase fetch failed:", e)
    return current_tick_state

@app.get("/history")
def get_history(limit: int = 50):
    if supabase:
        try:
            res = supabase.table('engine_history').select('*').order('id', desc=True).limit(limit).execute()
            return res.data[::-1] # return chronological order
        except Exception as e:
            print("Supabase fetch failed:", e)
    return []

@app.get("/metadata")
def get_metadata():
    try:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        with open(os.path.join(base_dir, 'models', 'cmapss_metadata.json'), 'r') as f:
            return json.load(f)
    except:
        return {"error": "Metadata file not found."}

@app.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Just wait for client disconnect
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
