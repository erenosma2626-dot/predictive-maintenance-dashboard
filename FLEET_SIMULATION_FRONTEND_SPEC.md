# Fleet Simulation — Frontend Spec

This is the frontend build spec for the "Fleet Simulation" tab (Bearing-only,
v1 scope). It consumes the backend already built (`fleet-simulation-api`,
Supabase tables: `machines`, `crews`, `events`, `monthly_reports`,
`agent_status`). Visual language is identical to the rest of the dashboard —
dark background, single amber accent, monospace labels, bordered panels — no
new colors or chrome introduced except where explicitly noted (Section 3).

---

## Page Layout: 5 Boxes in a Grid

```
+---------------------------+  +---------------------------+
|  BOX 1: Fleet Overview    |  |  BOX 2: Diagnosis + 3D     |
|  (Map / List toggle)      |  |  (selected machine detail) |
+---------------------------+  +---------------------------+
+---------------------------+  +---------------------------+
|  BOX 3: Priority Queue    |  |  BOX 4: Monthly Reports    |
+---------------------------+  +---------------------------+
+---------------------------+
|  BOX 5: Crew Roster       |
+---------------------------+

[ AGENTS ]  <- small fixed panel, top-right corner, overlaying the grid
```

Exact grid proportions are up to the frontend implementation, but Box 2
(Diagnosis + 3D) should be the visually largest/most prominent box — it's
the centerpiece, everything else is supporting context.

---

## Data Sources (Recap)

All five boxes read from Supabase (direct client-side subscription/polling —
no new backend endpoints needed beyond what already exists):

- `machines` — id, display_name, status, risk_probability, life_pct, fault_type, top_shap_feature, last_updated
- `crews` — id, status, assigned_machine_id, eta_sim_hours
- `events` — id, sim_timestamp, machine_id, event_type, message, agent_name, created_at
- `monthly_reports` — id, month_number, planned_count, unplanned_count, total_downtime_cost, total_value_preserved, net_value, detail_json
- `agent_status` — agent_name, current_state, current_machine_id, last_updated

Use Supabase's realtime subscription (`on('postgres_changes', ...)`) where
possible so the UI updates without polling; fall back to a short polling
interval (e.g. every 2-3 seconds) if realtime setup is more friction than
it's worth for a v1.

---

## Box 1 — Fleet Overview (Map / List Toggle)

Two sub-views, switchable via a small internal toggle at the top of the box.

### Map view
A top-down 2D "factory floor" illustration — a simple rectangular room outline
with 12 machine icons placed in a grid or scattered layout inside it (exact
positions are cosmetic/fixed, don't need to mean anything physically). Each
machine icon has a small status light:
- Green (or muted amber, matching the app's no-red-except-alert rule — see
  Section 3) = healthy
- Red, static (not blinking here — blinking is reserved for Box 2's alert
  state) = at_risk

Clicking a machine icon selects it, which drives Box 2's content (see below).

### List view
A simple vertical list, one row per machine:
```
M01 — Healthy
M02 — At Risk (Roller Element)
M03 — Healthy
...
```
Clicking a row does the same thing as clicking a map icon — selects it for
Box 2.

**Selection state:** track "currently selected machine" as shared UI state.
Default selection on page load: the machine with the highest current
`risk_probability` (so Box 2 isn't empty/arbitrary on first load).

---

## Box 2 — Diagnosis + 3D Model (Centerpiece)

Shows the **currently selected** machine (from Box 1). Two parts stacked or
side-by-side within the box:

### 3D model panel
Renders the bearing 3D asset (per `BEARING_3D_VISUAL_SPEC.md`), with the
region corresponding to the selected machine's `fault_type` highlighted.
See the detailed mapping in Section 3 below — this is the most technically
involved part of the page.

### Text panel
Below/beside the 3D view:
```
UNIT: M02
STATUS: AT RISK (0.76)
FAULT TYPE: Roller Element

DIAGNOSIS:
"Machine M02 shows a high risk (0.76) of roller element fault;
this is the second time this unit has been flagged, suggesting
a recurring issue rather than a one-off."
```

**Loading state (important, ties into the async Diagnosis Node):** when
`agent_status.diagnosis.current_state == 'working'` **and**
`agent_status.diagnosis.current_machine_id` matches the selected machine,
show a quiet loading indicator instead of stale/missing text — e.g.
`"⏳ DIAGNOSIS AGENT ANALYZING..."` in the same muted style used elsewhere for
low-emphasis states. Once the corresponding `diagnosis_complete` event lands
in the `events` table for that machine, replace the loading line with the
real diagnosis text. This is the direct payoff of making Diagnosis
asynchronous on the backend — the UI should visibly reflect "agent is
thinking" rather than appearing frozen or showing outdated text.

If the selected machine is healthy (no active diagnosis), show a quiet
default state instead: `"No active risk. Last checked: <timestamp>."`

---

## Box 3 — Priority Queue

A short list (top 5) of machines that are either `at_risk` or queued
(`queued_no_crew` in their most recent event), ranked by priority — reuse
the same expected-value-style logic already established for prioritization
(cost-of-delay), not simple recency.

```
PRIORITY QUEUE
1. M02 — Roller Element — Crew dispatched (ETA: 2 ticks)
2. M07 — Inner Race — Queued (no crew available)
3. M11 — Outer Race — Crew dispatched (ETA: 4 ticks)
```

Clicking an entry in this list also sets it as the Box 1/Box 2 selection
(shared selection state across the whole page).

---

## Box 4 — Monthly Reports

A vertical list of collapsed report entries:
```
> Month 1
> Month 2
> Month 3
```
Clicking one expands it in place (or opens a modal/side panel — frontend's
choice) showing the full `detail_json` content: planned/unplanned counts,
downtime cost breakdown, net value, and the LLM-generated executive summary
text. This is read from `monthly_reports`, ordered by `month_number` descending
(most recent first).

---

## Box 5 — Crew Roster

```
CREWS
CREW-1   AVAILABLE
CREW-2   → M02 (repairing, 2 ticks left)
CREW-3   AVAILABLE
```

Simple list from the `crews` table — status plus, if dispatched, which
machine and remaining time.

---

## Agents Status Panel (Fixed Overlay, Top-Right)

Already specified in `FLEET_SIMULATION_TECHNICAL_SPEC.md` Section 4 — repeated
here for completeness since it's part of this same page:

```
AGENTS
Monitoring    ACTIVE
Diagnosis     WORKING (M02)
Planning      IDLE
Reporting     IDLE
```

Reads directly from `agent_status`. `current_machine_id`, when present, is
shown in parentheses next to the agent name (as above) so the user can see
*which* machine an agent is currently working on.

---

## Section 3 — 3D Model Fault-Type Highlighting (Detailed)

This is the part that needs the most explanation, since it connects the
existing `BEARING_3D_VISUAL_SPEC.md` geometry to live backend data.

### What you already have
The existing bearing 3D asset (per the earlier spec) has four labeled,
distinct geometric parts: **inner race**, **rolling elements** (the ring of
balls/rollers, plus the connecting **cage**), and **outer race** — surrounded
by the static shaft and housing.

### The mapping (fault_type → highlighted region)

| `fault_type` value | Highlighted region |
|---|---|
| `inner_race` | The inner race ring |
| `outer_race` | The outer race ring |
| `roller_element` | The ring of rolling elements (and optionally the cage) |

### What "highlighted" should look like
Reuse the exact alert-state visual language already defined for the blinking
risk button (Turbofan/Bearing toggle addendum): the highlighted region turns
**red and pulses/blinks slowly** (~1Hz), while every other part of the model
continues its normal healthy-state motion (inner race spinning, rolling
elements orbiting, outer race static) — the highlight is a color/material
change on the affected part only, not a change to the animation itself.

When the selected machine is healthy, no region is highlighted — the model
renders in its normal, quiet, all-amber-or-neutral state.

### Do you need a new 3D asset, or can you modify the existing one?

**You do not need a new 3D model.** The existing wireframe asset already has
the three parts (inner race, rolling elements/cage, outer race) as
geometrically distinct pieces per its own spec — what's needed is a
**code-level change**, not a new export:

1. Each of the three regions needs to be a **separately addressable object/mesh**
   in the 3D scene (if they aren't already split out as individual objects in
   the current implementation, they need to be — this is likely the only real
   "rebuild" work, and it's a scene-graph/grouping change, not a re-model).
2. Add a small piece of state to the 3D component: `highlightedRegion: 'inner_race' | 'outer_race' | 'roller_element' | null`.
3. When `highlightedRegion` is set, apply the red pulsing material/color to
   that specific object only; when `null`, all parts render in their normal
   state.
4. Drive `highlightedRegion` from the selected machine's `fault_type` (only
   when that machine's `status === 'at_risk'`; `null` otherwise).

If, when you look at the current 3D implementation, the three regions turn
out to already be separate objects (which is likely, since the original
spec described them as distinct wireframe rings/spheres built independently),
this is purely a state-wiring task — no new 3D export needed at all. Only
re-export a new asset if the existing one was built as a single fused mesh
that can't be addressed by region; check this first before doing any new 3D
work.
