# Dashboard Frontend Spec — Addendum: Multi-Dataset Toggle (C-MAPSS ↔ Bearing)

This extends `DASHBOARD_SPEC.md` (visual language, Page 1/2/3 structure, color
palette — all still in effect, unchanged). This document adds the dataset
switcher and the Bearing-specific content that differs from C-MAPSS.

---

## The Toggle

A pill-shaped, two-position toggle sits directly above the top navigation
(`[ LIVE ] [ BUSINESS VALUE ] [ DATASET DEEP-DIVE ]`), styled as two connected
circles joined by a track — a physical "slider" switch, not a dropdown.

- **Position 1 (left):** C-MAPSS / Turbofan Engine
- **Position 2 (right):** IMS Bearing

**Labeling:** the toggle itself can stay visually minimal (e.g. small engine/
bearing glyphs or just filled/unfilled circles), but **on hover**, show the
categorical equipment-type name in a tooltip:
- Position 1 hover → `TURBOFAN ENGINE` (this is the correct categorical term —
  same naming register as "Bearing" or "Milling Tool": a class of rotating
  machinery, not the C-MAPSS dataset name itself)
- Position 2 hover → `BEARING`

Switching the toggle re-themes and re-populates all three pages from the
selected dataset's model/data — same page structure, same visual language
(dark background, amber accent, monospace), different content underneath.

---

## Page 1 — "Live" (Both Datasets)

### Shared structure
Both datasets keep the same three-element layout from the base spec:
**A)** live telemetry stream, **B)** risk indicator, **D)** morphing
1st/2nd-factor panel. What changes is *how the risk state is displayed*.

### C-MAPSS (Turbofan) — unchanged from base spec
Segmented risk bar (discrete amber blocks filling left-to-right) as already
specified. Confidence qualifier label as already specified.

### Bearing — new: blinking red alert button
Instead of (or alongside — see note below) the segmented bar, the Bearing view
uses a **circular alert button**:
- **Default state (risk probability < 0.75):** the button sits filled with the
  same muted amber tone used elsewhere, static, no animation, at low visual
  weight — it reads as "present but quiet."
- **Alert state (risk probability ≥ 0.75):** the button turns **red** and
  **blinks** (slow pulse, e.g. ~1Hz opacity fade — not a jarring strobe). This
  is the one deliberate exception to the "no red, amber-only" rule established
  in the base spec — reserved specifically for this single, binary,
  high-confidence moment (≥0.75 is a real threshold crossing, not a
  continuous gradient, so a discrete visual break is appropriate here).
- Label directly under the button: `RISK: NOMINAL` (default) /
  `RISK: CRITICAL` (alert), in the same monospace caption style as the rest
  of the UI.
- Threshold is fixed at 0.75 (not user-adjustable in this version).

**Confidence qualifier:** unlike C-MAPSS (where confidence is tied to % of
average lifespan), Bearing model reliability is bearing-instance-dependent and
not knowable in advance for a synthetic stream. Show a static, honest caption
near the button instead: `MODEL RELIABILITY: VARIES BY UNIT — SEE DEEP-DIVE`.

### Element D (1st/2nd Factor panel) — same mechanic, different content
Same morphing 4-cell ↔ 2×2-alert-panel behavior as the base spec. For Bearing,
`top_features` will report `rms_rm_norm` / `kurtosis_rm_norm` — display them
with plain-language labels rather than raw feature names:
- `rms_rm_norm` → `Vibration Intensity`
- `kurtosis_rm_norm` → `Impact Sharpness`

---

## Page 2 — "Business Value"

**C-MAPSS:** unchanged — full expected-value framework as already specified
(reactive/preventive/model bar chart, methodology/sourcing section below it).

**Bearing:** **not implemented yet.** When the toggle is set to Bearing, Page 2
should show a simple placeholder state — centered text, no chart:

```
BUSINESS VALUE MODELING — COMING SOON

The expected-value framework used for the Turbofan dataset has not yet been
calibrated for Bearing data. Switch to Turbofan to see the full analysis.
```

Keep this placeholder in the same visual language (monospace, muted, bordered
panel) rather than a generic "empty state" — it should look like an
intentional, labeled section of the instrument panel, not a broken page.

---

## Page 3 — "Dataset Deep-Dive" — Bearing-Specific Content

Same card-based, spec-sheet visual language as the base spec's Page 3, but
entirely different content:

- **Dataset identity card:** IMS/NASA Bearing Dataset — Center for Intelligent
  Maintenance Systems (University of Cincinnati) / NASA Ames Prognostics Data
  Repository. Three test-to-failure experiments (Sets 1/2/3), 12 bearings
  total, Rexnord ZA-2115 double-row bearings, 2000 RPM constant speed, 6000 lb
  radial load, vibration sampled at ~20kHz.
- **Feature panel:** RMS and Kurtosis (both rolling-smoothed over 20 files,
  then normalized to each bearing's own early-life baseline) — explained in
  plain language: *"how strong the vibration is"* and *"how sharp/impulsive
  the vibration pattern is"*, each expressed as a multiple of that bearing's
  own healthy-state level.
- **Model panel:** Random Forest Classifier, leave-one-bearing-out validation
  (12 folds — every bearing evaluated as a held-out unit, never trained on
  itself).
- **Honest performance panel:** this is the centerpiece, mirroring the
  Turbofan page's "when does this model become reliable" framing but adapted:
  reproduce the **12-bearing grid** (Section 8 of the notebook) — one small
  chart per bearing showing predicted risk probability vs. the true last-5%
  risk region. Frame it plainly: *"Reliability varies by bearing — roughly
  half show a clean quiet-early/sharp-late-alarm pattern; the rest are
  noisier throughout their recorded life."* Do not average this away into a
  single score; the per-bearing variability *is* the honest finding.
- **What we tried and discarded panel:** short list — GMM-HMM-based automatic
  transition detection (inconsistent across bearings), 3-tier health-state
  classification (worse than binary), continuous RUL regression (highly
  unreliable, R² negative in most folds) — each with a one-line result, same
  "lab notebook" tone as the Turbofan deep-dive.
- **Data access note:** raw data (~7GB across three sets) is not bundled with
  the app — link out to the source (IMS/NASA Prognostics Data Repository) for
  anyone wanting to reproduce the notebook.

---

## Data Contract (Bearing)

Backend will expose a bearing-equivalent of the C-MAPSS stream, built from
`models/bearing_model.pkl` + `models/bearing_avg_template.csv` +
`models/bearing_std_template.csv` (average-template-based synthetic generator,
same spirit as `SyntheticEngineStream` but resampled onto a 0–100% life-percentage
axis rather than discrete cycles). Expected tick shape:

```json
{
  "life_pct": float,
  "tick": int,
  "sensors": {"rms_rm_norm": float, "kurtosis_rm_norm": float},
  "risk_flag": 0 | 1,
  "risk_probability": float,
  "explanation": {
    "top_features": [
      {"feature": "rms_rm_norm", "display_name": "Vibration Intensity", "value": float},
      {"feature": "kurtosis_rm_norm", "display_name": "Impact Sharpness", "value": float}
    ]
  }
}
```

Frontend logic: `risk_flag` or `risk_probability >= 0.75` drives the blinking
red button state on Page 1. This backend piece is not yet built — build the UI
first against a mock generator matching this shape, wire up the real backend
once it exists (same approach as the C-MAPSS build).

---

## Summary of What NOT to Change

- Base color palette, typography, panel/border style — identical across both
  toggle positions.
- Page 1's overall 3-element composition — identical structure, Bearing just
  swaps the risk-bar visualization for the alert button.
- Page 3's card-based layout pattern — identical structure, different content.
- The "no red except this one case" rule — the Bearing alert button is the
  single sanctioned exception, specifically because it's a discrete
  ≥0.75-threshold event, not a continuous gradient.
