# Predictive Maintenance Dashboard & Industrial AI Copilot
### NASA C-MAPSS (Turbofan Engines) & IMS Rexnord Bearing Datasets

**Live Demo:** [https://predictive-maintenance-dashboard-git-main-eren25.vercel.app](https://predictive-maintenance-dashboard-git-main-eren25.vercel.app)

An end-to-end, explainable predictive maintenance platform, multi-agent fleet simulation engine, and Groq-powered Industrial AI Copilot built on NASA's C-MAPSS turbofan engine dataset and the IMS Bearing dataset — designed around one non-negotiable principle: **never claim more certainty than the data actually supports.**

---

## 🌟 Key Architecture & Capabilities

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 FRONTEND (React + Vite)                 │
                  │  • Interactive 3D Digital Twins (Three.js)              │
                  │  • Live Telemetry Stream & SHAP Explainability          │
                  │  • 2D Top-Down Bearing Siri-style Chatbot Widget        │
                  │  • 5-Stage Operator Intervention Station (Modal)        │
                  │  • Full TR / EN Context-Aware Internationalization      │
                  └────────────────────────────┬────────────────────────────┘
                                               │
                                               ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │             BACKEND (FastAPI + LangGraph)               │
                  │  • Multi-Agent Autonomous Fleet Simulation Graph        │
                  │  • Groq LLM (openai/gpt-oss-20b) RAG Engine             │
                  │  • Operator Solution SOP Evaluator (0-100 Scoring)      │
                  │  • Simulation Auto-Pause & Resume Synchronization       │
                  │  • Manual Crew Mode & Human-in-the-Loop Approval        │
                  └────────────────────────────┬────────────────────────────┘
                                               │
                                               ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │                   DATA & KNOWLEDGE STORE                │
                  │  • Supabase (PostgreSQL Realtime Sync)                  │
                  │  • 12 Industrial Bearing Asset Specifications (M01-M12) │
                  │  • 30+ Fault Modes & Standard Operating Procedures (SOP)│
                  │  • Historical Work Orders & ISO 10816-3 Technical Manual│
                  └─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Core Subsystems

### 1. Multi-Agent Fleet Simulation (LangGraph)
A live, tick-driven simulation running a 12-unit industrial fleet continuously in the background. Each machine ages independently based on statistical patterns from NASA/IMS datasets.
- **Monitoring Agent:** Ultra-fast rule-based threshold scanner checking wear and vibration levels.
- **Diagnosis Agent:** Natural-language root-cause analyzer with escalation history detection.
- **Planning Agent:** Cost-of-delay priority queuing algorithm managing maintenance crew dispatching.
- **Reporting Agent:** Monthly financial and operational executive summaries.
- **Human-in-the-Loop Approval Manager:** Allows manual intervention before crew dispatching.
- **Manual Crew Mode:** Suspends autonomous dispatches and passes full control to the operator.

### 2. Groq-Powered Industrial Bearing AI Copilot & Knowledge RAG
Mounted natively on `/api/bearing` and powered by Groq's high-speed LLM inference (`openai/gpt-oss-20b`):
- **Deterministic Domain Knowledge Store (`data/bearing_knowledge/`):**
  - `bearing_assets.json`: 12 bearing asset records (SKF, FAG, NSK, Timken models, RPM, BPFI/BPFO multipliers, lubrication specs).
  - `bearing_fault_catalog.json`: 30+ failure modes with spectral signatures, Kurtosis/RMS thresholds, and step-by-step SOPs.
  - `bearing_maintenance_history.json`: Historical maintenance records and past work orders.
  - `bearing_technical_manual.md`: Engineering manual with kinematic equations and ISO 10816-3 severity tables.
- **5-Stage Operator Intervention Station:**
  1. **Fault Alert & Asset Parameters:** Shows telemetry, vibration levels, and fault zone.
  2. **AI Engineering Chatbot:** Delivers concise 3-part diagnostic summaries and actionable team briefing notes.
  3. **Machine & Crew Selection:** Dual-column asset and available crew selector.
  4. **Solution Verification Gate:** The operator inputs proposed repair steps; an AI Evaluator validates against official SOPs and assigns a 0-100 score.
  5. **Live Dispatch & Repair Accordion:** Collapsible real-time progress tracker with problem/solution logs.
- **Auto-Pause Simulation:** Automatically halts machine degradation while the operator investigates and resumes upon completion.

### 3. 2D Top-Down Bearing Siri-Like Floating Widget
- Custom-designed 2D top-down bearing SVG icon with metallic neon styling and hover tooltip.
- Slides up a mobile phone-style chat drawer.
- **Shared Chat State:** Real-time synchronization between the floating widget and Stage 2 of the Copilot Modal.

### 4. Interactive 3D Digital Twins (Three.js)
- Real-time 3D rendered models for both Jet Engine (C-MAPSS) and Rolling Bearing.
- Dynamic component-level fault illumination (Inner Race, Outer Race, Roller Elements, HPC/LPT degradation).

---

## 📊 Scientific Methodology & Validation

### Datasets
1. **NASA C-MAPSS (FD001):** 100 run-to-failure training engines, 100 test engines, 14 active sensors used out of 21. Single fault mode (HPC degradation).
2. **IMS Bearing Dataset (Rexnord):** 3 test-to-failure experiments (12 bearings total), 2000 RPM, 6000 lb radial load, 20kHz sampling rate.

### Feature Engineering
- **C-MAPSS:** 10-cycle rolling mean (`_rm`), expanding-window linear slope (`_trend`), baseline deviation (`_dev`) — 42 features feeding a Random Forest Classifier.
- **Bearings:** Rolling RMS (vibration intensity) and Rolling Kurtosis (impact sharpness) normalized to early-life baseline.

### Honest Validation (The Core Finding)
Most published work on these datasets reports inflated accuracy by measuring **retrospectively** on full lifecycles. When evaluated under genuine early-life conditions (fixed cutoffs at 20%, 40%, 60%, 80% lifespan), recall remains low (<0.28) until late stages. 

| Evaluation Horizon | Recall |
|---|---|
| NASA's official test set (often late-stage cutoff) | **0.938** |
| Fixed cutoff at 20% of lifespan | 0.000 |
| Fixed cutoff at 40% of lifespan | 0.000 |
| Fixed cutoff at 60% of lifespan | 0.000 |
| Fixed cutoff at 80% of lifespan | 0.206 |
| Fixed cutoff at 100% of lifespan | 0.213 |

The platform communicates these physical limitations transparently at all times.

---

## 💻 Tech Stack

- **AI & LLM Inference:** Groq API (`openai/gpt-oss-20b`, low reasoning latency)
- **Multi-Agent Orchestration:** LangGraph, StateGraph, Python 3.11
- **Machine Learning:** scikit-learn (Random Forest), SHAP (Explainability), pandas, numpy
- **Backend API:** FastAPI, Uvicorn, REST + WebSocket endpoints
- **Database & Sync:** Supabase (PostgreSQL Realtime)
- **Frontend UI:** React 18, Vite, Three.js / @react-three/fiber, Lucide Icons, Vanilla CSS
- **Localization:** Complete English & Turkish (TR / EN) i18n
- **Deployment:** Render (Backend API), Vercel (Frontend Dashboard)

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API Key (and Supabase project credentials)

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Backend Setup
```bash
# Install Python dependencies
pip install fastapi uvicorn supabase langgraph langchain-core groq scikit-learn pandas numpy shap httpx

# Start the Fleet Simulation & Bearing Copilot API
uvicorn src.fleet-simulation-api.main:app --host 127.0.0.1 --port 8001 --reload
```

### 4. Frontend Setup
```bash
cd dashboard

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📜 License
MIT License. Developed for research, industrial AI prototyping, and predictive maintenance education.
