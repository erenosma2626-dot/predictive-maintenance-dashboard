# Fleet Simulation — LangGraph Upgrade: Summary & Frontend TODO

This documents what was added on top of the already-working Fleet Simulation
backend (Stages 1-6, both Bearing and Turbofan/C-MAPSS instances). Nothing
about the existing data model, tables, or UI plan changed — this is an
upgrade to the *agent orchestration layer only*.

---

## What Was Built (Backend, Done)

### Stage A — Migrated to LangGraph (no behavior change)
The four agent functions (Monitoring, Diagnosis, Planning) were converted
into LangGraph nodes, connected via a compiled `StateGraph` instead of being
called as plain sequential function calls inside `simulation_loop()`.
Behavior is identical to before this upgrade — this stage was purely
infrastructural, to lay the groundwork for Stage B.

- New shared `SimulationState` (TypedDict) carries `tick_results`,
  `current_machine_id`, and `dataset_type` between nodes automatically,
  replacing manual parameter-passing.
- `simulation_graph.ainvoke(...)` now drives the per-tick flow, per
  `dataset_type` (bearing / cmapss run as separate graph invocations,
  distinguished by `thread_id` in the LangGraph config).

### Stage B.1 — Conditional Branching (Escalation Path)
A new `is_recurring_issue()` check looks at a machine's recent `events`
history (last 20 events, more than 2 prior `risk_detected` entries =
recurring). Based on this, `route_after_monitoring()` sends the flow down
one of two paths after Monitoring:
- **Normal path:** Monitoring → Diagnosis → Planning (first-time or
  infrequent risk)
- **Escalation path:** Monitoring → Escalation → Planning (recurring risk) -
  a separate LLM prompt that explicitly frames the issue as persistent/
  underlying rather than routine, logged as `escalation_diagnosis_complete`
  instead of `diagnosis_complete`.

Verified working in both Bearing and Turbofan instances - escalation
messages correctly flag repeat offenders (e.g. "Machine M11's persistent
inner race fault... requiring thorough investigation beyond standard
maintenance").

### Stage B.2 — Human-Approval Gate (Toggleable, Off by Default)
Before Planning dispatches a crew, it now checks a single settings flag. If
enabled, the graph genuinely pauses (via LangGraph's `interrupt()` +
`MemorySaver` checkpointer) until an external approval call resumes it.

- **New table:** `app_settings` (`key`, `value`) - currently holds
  `human_approval_enabled` (`'true'` / `'false'`), default `'false'`.
- **New endpoints** on the backend:
  - `GET /pending-approvals/{dataset_type}` - returns whether the graph is
    currently paused for that dataset, and the pending action's details
    (`machine_id`, `crew_id`).
  - `POST /approve-dispatch/{dataset_type}?approved=true|false` - resumes
    the paused graph with the given decision. If rejected, the machine is
    skipped for that tick (logged as `dispatch_rejected`) rather than
    dispatched.
- Verified working end-to-end: with the flag on, dispatch genuinely pauses
  (no `crew_dispatched` events fire) until approved via the endpoint.
- **Current state: flag is set to `'false'`** - the system runs fully
  automatic by default, per your preference. Toggle it on only when you
  specifically want to demo/use manual approval.

---

## What's Left: Frontend Work

Everything below is new UI needed to expose Stage B.2 (the approval gate) to
a human via the dashboard, instead of curl commands. This sits inside the
existing Fleet Simulation page (no new page/tab needed).

### 1. Approval Mode Toggle
A small switch/button, placed near the Agents status panel (top-right area
makes sense, since it's a system-wide control, not tied to one machine):
```
[ ] Require approval before crew dispatch
```
- Reads and writes `app_settings.human_approval_enabled` directly via the
  existing Supabase client (no new backend endpoint needed for the toggle
  itself - just an update to that one row).
- Should default to **off** on page load, matching the backend default.

### 2. Pending Approval Panel
When the toggle is on **and** a dispatch is pending, show a small modal or
inline panel (reuse the existing bordered-panel visual style):
```
APPROVAL NEEDED
Machine: M03
Proposed crew: CREW-1

[ Approve ]   [ Reject ]
```
- Poll `GET /pending-approvals/{dataset_type}` every few seconds (or use a
  Supabase realtime listener on `events`/`agent_status` if that's already
  wired up elsewhere on the page) to detect when something is waiting.
- On button click, call `POST /approve-dispatch/{dataset_type}?approved=true|false`.
- Panel should disappear once `pending-approvals` returns `false` again.
- If both Bearing and Turbofan machines can be pending simultaneously
  (independent graphs), the panel needs to handle/queue both - check
  `/pending-approvals/bearing` and `/pending-approvals/cmapss` separately,
  and if both are pending, show them as two separate cards rather than
  merging them.

### 3. Escalation Events in the Event Feed
The existing event feed (already planned in the base Fleet Simulation
frontend spec) should visually distinguish `escalation_diagnosis_complete`
events from regular `diagnosis_complete` ones - e.g. a slightly stronger
amber weight or a small `[ESCALATED]` tag prefix, so a recurring issue
stands out when scanning the feed. No new panel needed, just a style rule
on an event type that already flows through the same `events` table.

### 4. "About" Content Update
Both `FLEET_SIMULATION_ABOUT_CONTENT.md` and
`FLEET_SIMULATION_ABOUT_CONTENT_TURBOFAN.md` should get one additional short
paragraph documenting the escalation path and the optional approval gate, so
the honesty/transparency pattern established for the rest of the page
extends to this new behavior. Suggested addition (same tone/format as
existing sections):

```
ABOUT ESCALATION & APPROVAL

If a machine is flagged as at-risk multiple times recently, it's routed to
a separate "escalation" diagnosis that explicitly flags it as a likely
persistent issue rather than a one-off. Optionally, you can require human
approval before any repair crew is dispatched (toggle above) - when
enabled, the system pauses and waits for a decision instead of dispatching
automatically.
```

---

## Not Changed / Out of Scope

- Reporting node - untouched, still triggered on the existing
  tick-count-based schedule per `dataset_type`.
- Database schema for `machines`, `crews`, `events`, `monthly_reports`,
  `agent_status` - unchanged.
- The 5-box layout, 3D fault highlighting, sim clock - all still per the
  original `FLEET_SIMULATION_FRONTEND_SPEC.md`, unaffected by this upgrade.
