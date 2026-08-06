# Predictive Maintenance Dashboard — Frontend Specification

## Purpose & Guiding Principle

This dashboard visualizes a predictive maintenance model trained on NASA C-MAPSS
(FD001) turbofan engine data. The single most important design principle, above any
visual concern: **the dashboard must never overstate what the model can actually do.**
Every screen must reflect the real, measured limitations of the underlying model —
strong late-stage/retrospective performance, weak genuine early-warning performance.
No number, badge, or color should imply more certainty than the data supports.

Visually, the product should read as a professional instrument panel — not a sales
demo, not a typical "AI startup" dashboard with glossy gradients and inflated metrics.
Think flight recorder / industrial control room, reinterpreted cleanly for the web.

---

## Visual Direction (Reference: attached mockup, "Flight Recorder Dashboard")

The provided mockup is the accepted visual baseline. Key elements to preserve:

- **Background:** near-black, slightly blue-tinted dark (e.g. `#0d1117`–`#11151c` range)
- **Primary text:** off-white / bone, not pure white — muted, analog-gauge feel
- **Single accent color:** a muted amber/ochre (e.g. `#D4914A`). This is the *only*
  saturated color in the UI. It appears at varying intensity/fill to indicate risk
  level — do not introduce a second accent color (no red/green traffic-light system).
- **Typography:** monospace-dominant (JetBrains Mono or similar) for all data, labels,
  numeric readouts — reinforces the "raw telemetry, not decorated" feel. A serif face
  may be used sparingly for page titles only, echoing old engineering manuals.
- **No gratuitous animation.** Motion only when data actually changes (chart scrolling,
  bar fill, numbers ticking). No hover glows, no bouncing, no particle effects.
- **Grid/panel structure:** bordered rectangular panels with thin 1px borders, small
  monospace section labels in caps (e.g. `SYSTEM RISK LEVEL`, `FEATURE IMPORTANCE`),
  echoing instrumentation panel labeling conventions.

---

## Site Structure: 3 Pages, Top Navigation

Three tabs/pages at the top of the app. Page 1 (Live) is the default/landing view.

```
[ LIVE ]   [ BUSINESS VALUE ]   [ DATASET DEEP-DIVE ]
```

---

## Page 1 — "Live" (Home)

**Goal:** the calmest, cleanest screen in the app. Exactly three visual elements, no
more. This is the page most users will actually watch — it must not be busy.

### Element A — Live Telemetry Stream
- A single scrolling line-chart (oscilloscope/EKG style, as in the mockup), fed by the
  synthetic engine stream's `tick()` output.
- Shows one sensor at a time by default (pick the model's top SHAP-contributing
  sensor as the default, e.g. whichever ranks highest in `cmapss_metadata.json`).
  Optionally allow switching which sensor is plotted via a small inline selector —
  but keep this understated, not a prominent control.
- Include the engine's current cycle count and stream metadata (engine ID, cycle /
  total, sample rate) exactly as shown in the mockup's `SRC:` / `RATE:` / `AMP:` line.

### Element B — Risk / Not-Risk Indicator
- A single, clear binary-leaning indicator (risky vs. not risky), styled as the
  mockup's segmented bar (discrete blocks filling left-to-right), not a needle gauge.
- Fill color intensity = model's predicted probability (`maintenance_probability`
  from the stream). Low probability = mostly empty / very muted fill. High
  probability = mostly full / more saturated amber. No red.
- **Directly adjacent, in small unobtrusive text, show the confidence-adjusted
  accuracy for the current stage of life.** This is important and easy to get wrong:
  - Do NOT show a single global "94% accuracy" figure — this is the retrospective
    number and would be misleading to show attached to a live, potentially early-stage
    prediction.
  - Instead show a stage-aware qualifier, e.g.: `Precision: ~94% · Early-stage recall: low`
    or, more simply, a small label like `CONFIDENCE: HIGH` once the engine is past
    ~80% of average lifespan (where the model is validated), and `CONFIDENCE: LOW
    (early-stage, unvalidated)` before that — driven directly by the cutoff-scan
    results already computed in the notebook (Section 14/15: recall ≈0 below 60%
    of average life, ≈0.21-0.28 from 80% onward).
  - Keep this label small, plain, unstyled — it should read like a calibration note
    on a measurement instrument, not a warning banner.

### Element C — Collapsible Log Panel
- Collapsed by default, sits at the bottom of the page, expandable via a subtle
  `+ LOGS` / terminal-style toggle (echoing the mockup's `TERMINAL // STD_OUT` panel).
- When expanded, shows a scrolling monospace feed of stream events: cycle ticks,
  engine start/end events, flag transitions (`> WARN: maintenance_flag raised at
  cycle 148`), styled exactly like the mockup's terminal panel.
- This is intentionally the "detail for those who want it" layer — collapsed state
  keeps Page 1 uncluttered.

### Element D — Live Top-2 Contributing Factors Panel (Morphing Slot)

A single fixed-size grid area (conceptually a 2×2 unit slot) that renders in one of
two mutually-exclusive states, depending on live risk level:

**Default state (risk below alert threshold): four small 1×1 cells**
- Top-left cell: label `1st FACTOR`, showing only the current top SHAP feature's
  name (e.g. `s_20_trend`) plus a minimal direction indicator (e.g. a small `+`/`−`
  or subtle up/down glyph) — no sentences, no numbers beyond that.
- Top-right cell: label `2nd FACTOR`, same treatment for the second-ranked feature.
- Bottom-left and bottom-right cells: empty/inactive placeholders (quiet, unfilled
  bordered boxes) — reserved space, not populated in the default state, present so
  the layout doesn't shift when switching states.
- These four cells update live, every tick, with no transition drama — they simply
  reflect whatever `explanation.top_features` currently says.

**Alert state (risk crosses into MODERATE/HIGH):**
- The four small cells morph/collapse into a single unified 2×2 panel occupying the
  exact same grid footprint.
- This panel displays the full professional alert message as produced by
  `format_alert_message()` (Engine ID, cycle/lifespan, risk probability + level,
  primary/secondary contributing signal with SHAP values, confidence basis line) —
  styled as a clear, slightly more prominent instrument-panel readout (e.g. a
  thicker border or slightly stronger accent tone; still no red, still amber-based).

**Returning to default state:**
- When risk drops back below threshold, or when the stream starts a new synthetic
  engine (`engine_source_unit` changes), the panel reverts to the four small-cell
  layout described above.
- Transition should be a clean, quick cross-fade/morph — not abrupt, not flashy.

This element sits directly below/beside Elements A and B on Page 1 (exact placement
at the frontend engineer's discretion, but it must remain within the same calm,
uncluttered composition — it should not make Page 1 feel busy in its default state).

**Nothing else goes on Page 1.** No separate SHAP bar-chart panel, no equipment
selector, no business metrics — those live elsewhere. Resist scope creep here.

---

## Page 2 — "Business Value"

**Goal:** make the dollar-based case, transparently sourced.

### Top section (primary, above the fold)
- The three-strategy bar chart from the notebook: Reactive / Preventive / Model,
  with dollar values labeled directly on the bars (as already built in the notebook's
  matplotlib version — recreate as an interactive/styled chart here).
- A running/cumulative counter, if feasible: as the live stream on Page 1 ticks,
  optionally accumulate a running "value generated vs. reactive baseline" number here.
  This is a nice-to-have, not required for v1 — flag it as a stretch goal.
- Sensitivity note directly under the chart, one line: something like `Ranking robust
  across FN cost -$40K to -$150K (see methodology)` — short, not a full essay here.

### Lower section — Methodology & Sourcing (transparency layer)
- A clearly-marked "Where these numbers come from" block containing:
  - The cost-benefit framework explanation (TP/FP/FN/TN dollar assumptions), stated
    plainly as *illustrative placeholders*, not calibrated real-world figures.
  - Attribution to the notebook/source that inspired the expected-value framework
    (the reviewed "Damage Propagation Modeling" Kaggle notebook using the "Data
    Science for Business" cost-benefit methodology) — include a link/citation here.
  - A link to the project's own notebook/methodology doc for full reproducibility.
- This section can be visually quieter/denser than the top section — it's reference
  material, not the headline.

---

## Page 3 — "Dataset Deep-Dive"

**Goal:** thorough, nerdy, but not boring. This is the "for people who want to go
deep" page — treat it like a well-designed technical spec sheet, not a wall of text.

Content to include (organize into clearly labeled panels/cards, consistent with the
instrument-panel visual language — think "spec sheet" rather than "blog post"):

- **Dataset identity card:** NASA C-MAPSS FD001 — what it is, source link, n=100
  training engines, n=100 test engines, single operating condition, single fault
  mode (HPC degradation), sensor count (21 total, 14 active after removing constants).
- **Feature panel:** the final feature set used (rolling mean, trend, baseline
  deviation), briefly explained in plain language — what each one captures.
- **Model panel:** algorithm (Random Forest Classifier), key hyperparameters,
  training approach (unit-based split, no leakage), link to/summary of the leakage
  audit performed.
- **Honest performance panel:** the retrospective-vs-prospective finding, presented
  as a small chart (recall vs. cutoff fraction — the exact table from Section 14/15
  of the notebook: 0.0 / 0.0 / 0.0 / 0.206 / 0.213 across 20%/40%/60%/80%/100% of
  average life). This is arguably the most important content on this page — treat it
  with a clean, well-labeled visualization, not just a table dump.
  - Give this a strong, clear framing/title along the lines of: *"When does this
    model actually become reliable?"*
- **What we tried and discarded panel:** short, scannable list of dead ends (stage-
  matched classification, tsfresh automated features) with one-line results each —
  this is what makes the page feel "cool" rather than sanitized: it shows real
  investigative work, not just a finished product.
- Tone for this page: technical but confident, slightly "lab notebook" in voice —
  use the same monospace/instrument-panel visual system as the rest of the app so it
  doesn't feel like a separate blog embedded in a dashboard.

---

## Deferred (Not for This Build): Multi-Dataset Switcher

Noted for a future iteration, **not implemented now.** The eventual vision: a
2-3-position toggle/slider (not a dropdown) that switches both the *theme* and the
*content* of all three pages to reflect a different underlying dataset/equipment
type (e.g. bearing, milling blade). Each position would carry its own accent-color
variant, its own live stream, its own business-value numbers, and its own dataset
deep-dive content, while preserving the same 3-page structure and visual language.
For now, build all three pages assuming a single, hardcoded dataset (C-MAPSS) — but
avoid deeply hardcoding dataset-specific strings in ways that would make this future
switch painful (e.g. prefer a small config/data object over inlined text where
reasonable, without over-engineering this now).

---

## Data Contract (Backend Interface)

The frontend consumes `src/synthetic/cmapss_generator.py` →
`SyntheticEngineStreamWithExplain.tick()` (extends the base `SyntheticEngineStream`
with SHAP-based per-prediction explanations, already implemented), returning:

```json
{
  "engine_source_unit": int,
  "cycle": int,
  "engine_total_lifespan": int,
  "sensors": {"s_2": float, "s_3": float, "...": "..."},
  "maintenance_flag": 0 | 1,
  "maintenance_probability": float,
  "explanation": {
    "top_features": [
      {"feature": "s_20_trend", "shap_value": -0.048},
      {"feature": "s_17_trend", "shap_value": -0.045}
    ],
    "message": "ALERT — Engine SYN-86, Cycle 148/158\nRisk probability: 0.97 (HIGH)\n\nPrimary contributing signal: ...\n\nConfidence basis: ..."
  }
}
```

Frontend usage notes:
- Element D's default-state small cells (`1st FACTOR` / `2nd FACTOR`) read directly
  from `explanation.top_features[0]` and `[1]` — display only the `feature` name and
  the sign of `shap_value` (do not show the raw float in the default state).
- Element D's alert-state panel displays `explanation.message` verbatim (it is
  already fully formatted server-side — no client-side string assembly needed).
- The alert-state threshold (when to switch from 4-cell to 2×2-panel layout) should
  be driven by `maintenance_probability` crossing into MODERATE (≥0.3) or HIGH
  (≥0.7) — match whichever threshold `format_alert_message()`'s own `risk_level`
  logic uses, to keep the panel's alert state and the message's stated risk level
  consistent.
- `models/cmapss_metadata.json` provides static model info (performance figures,
  known limitations, feature list) for Pages 2 and 3.
