# Backend Deployment & Live Data Roadmap

This is a step-by-step plan to take the existing model + synthetic stream + SHAP
explanations and turn them into a persistent, always-visible live service that any
visitor sees in the same state (no reset on page refresh). Implementation details are
left to the coding tool/session you continue with — this file is the checklist and
the service links you'll need.

---

## 1. Database — Supabase

**Why:** Persistent storage for the current engine state and history, so a page
refresh (or a backend restart) doesn't lose progress.

- Website: https://supabase.com
- Steps: create a free project → note the Project URL, `anon` key, and `service_role`
  key (Project Settings → API) → create two tables via the SQL Editor:
  - `current_state` — single row (id=1), holds the latest tick's full data
  - `engine_history` — append-only log of every tick, for the log panel / future analysis
- Known limitation: free projects pause after 7 days with zero database activity.
  This should not trigger here since the backend writes continuously — but keep it in
  mind if the backend itself goes to sleep for an extended period (see step 3).

## 2. Backend Hosting — Render

**Why:** Runs the always-on Python process (FastAPI) that ticks the synthetic stream,
writes to Supabase, and serves REST + WebSocket endpoints to the frontend.

- Website: https://render.com
- Steps: connect your GitHub repo → create a new **Web Service** → point it at the
  backend folder/entry point → set environment variables (`SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`) → deploy.
- Known limitation: free web services spin down after 15 minutes of inactivity (no
  incoming HTTP requests), and take 30-60 seconds to cold-start again. This pauses
  the tick loop while asleep. Addressed in step 3.

## 3. Keep-Alive — UptimeRobot (or cron-job.org)

**Why:** Prevents Render's free-tier service from sleeping, so the tick loop — and
therefore the Supabase writes — never stop. This is an unofficial workaround, not a
guaranteed SLA, but widely used and reliable enough for a portfolio/demo project.

- Website: https://uptimerobot.com (alternative: https://cron-job.org)
- Steps: create a free account → add an HTTP(s) monitor pointing at your Render
  service's health-check URL (e.g. `https://your-service.onrender.com/`) → set the
  check interval to 5 minutes (well under Render's 15-minute sleep threshold).

## 4. Frontend Hosting — Vercel

**Why:** Hosts the Next.js/React dashboard UI. Not used for the live loop itself
(Vercel doesn't support long-running background processes) — only for serving pages
and connecting to the Render backend via REST + WebSocket.

- Website: https://vercel.com
- Steps: connect your GitHub repo (frontend project) → deploy → set an environment
  variable pointing to the Render backend's base URL (e.g.
  `NEXT_PUBLIC_API_URL=https://your-service.onrender.com`) so the frontend knows
  where to fetch/connect.

---

## What the Frontend Needs to Do (Data Flow Summary)

1. **On page load:** call `GET {RENDER_URL}/current-state` to fetch whatever the
   latest tick was — this is what makes the state consistent across refreshes and
   across different visitors (everyone loads the same current row from Supabase).
2. **After initial load:** open a WebSocket connection to `{RENDER_URL}/live` to
   receive new ticks as they happen, without polling.
3. **For the log panel:** call `GET {RENDER_URL}/history?limit=50` (or similar) to
   populate the collapsible log with recent past ticks.
4. **For static model/dataset info** (Pages 2 and 3 of the dashboard spec): call
   `GET {RENDER_URL}/metadata`.

Each tick's JSON shape (from `current-state`, `/live`, and `/history`) matches the
contract already documented in `DASHBOARD_SPEC.md`, including the `explanation`
object (SHAP top features + formatted alert message).

---

## Order of Operations (Recommended)

1. Set up Supabase tables (step 1) — do this first, everything else depends on it.
2. Get the backend running **locally** first, pointed at the real Supabase project,
   and confirm ticks are actually being written (check the Supabase table editor).
3. Deploy the working backend to Render (step 2).
4. Set up UptimeRobot pointed at the deployed Render URL (step 3).
5. Only once the backend is confirmed stable and continuously ticking, start/continue
   frontend work against the live Render URL (step 4) — this avoids building UI
   against a backend that isn't actually persisting anything yet.
