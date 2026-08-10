# Fleet Simulation (Turbofan) — "About This Page" Content Spec

Same purpose and placement as the Bearing version
(`FLEET_SIMULATION_ABOUT_CONTENT.md`) - a short, honest explainer, shown when
the dataset toggle is set to Turbofan. Reuses the exact same visual pattern
(quiet, monospace, collapsed/expandable panel) - only the wording changes to
reflect the different dataset and fault framing.

---

## What This Page Is

```
WHAT AM I LOOKING AT?

This is a live simulation of a small fleet of 12 turbofan engines, running
continuously. Each engine ages independently - some degrade quickly, some
slowly - based on statistical patterns learned from the NASA C-MAPSS
(FD001) dataset, the same model validated in the Dataset Deep-Dive page.
When an engine's risk crosses a threshold, an AI agent diagnoses the likely
issue, a repair crew is dispatched, and the outcome (planned repair vs.
unplanned failure) feeds into a running economic tally.

Nothing here is paused or replayed - the simulation runs continuously in the
background, whether or not anyone is watching, the same way the Live tab's
telemetry stream does.
```

---

## How Time Works

```
HOW TIME WORKS HERE

Time in this simulation is heavily compressed: roughly 5 real-world minutes
represent one simulated month. The date shown at the top of the page (e.g.
"Month 3, 2026") reflects this compressed simulated calendar, not real time.

This lets a full maintenance cycle - an engine aging, showing early warning
signs, getting flagged, diagnosed, and repaired - unfold in minutes instead
of weeks, so the value of predictive maintenance is observable in a single
sitting rather than requiring you to watch it for months.
```

---

## How the Economics Work

```
HOW THE NUMBERS WORK

Every planned repair and every unplanned failure affects a running economic
total, shown in the Monthly Reports section. The logic follows a simple,
consistent rule grounded in real industry patterns: planned maintenance
(caught early, scheduled crew visit) is modeled as meaningfully cheaper and
faster than unplanned failure (missed warning, emergency response, and a
chance of additional cascading cost).

This mirrors real published findings on predictive maintenance in aviation
and heavy industry more broadly - a routine, scheduled component swap is
consistently far cheaper than an unplanned in-service failure, which can
involve emergency logistics, secondary damage, and lost operating time. The
relative gap in this simulation (planned vs. unplanned cost) is built to
reflect that same kind of order-of-magnitude difference, not a linear "10%
more expensive" penalty.

Important: the specific dollar figures shown are illustrative, not real
repair quotes or real production-loss figures. They are proportionally
realistic - sized to demonstrate the shape of the value predictive
maintenance creates - rather than a literal financial forecast for any real
fleet operator.
```

---

## What the "Fault Type" Means (Honesty Note)

```
ABOUT "FAULT TYPE"

Each engine, when flagged as at-risk, is shown with a simulated fault
description to make the diagnosis view concrete and easy to follow. The
underlying risk score itself is real - produced by a model trained and
validated on the NASA C-MAPSS dataset (see Dataset Deep-Dive), where the
single degradation mode tracked is High-Pressure Compressor (HPC)
degradation. The specific sensor(s) cited as the primary driver of a given
alert (e.g. a pressure or temperature reading) reflect the model's own
top-contributing feature for that prediction, not a precise physical
location within the engine - treat the fault description as a
demonstration aid for the diagnosis experience, not as a fully
location-verified finding.
```

---

## What the Agents Actually Do

```
WHAT THE AGENTS DO

- Monitoring: continuously checks every engine's risk level against a
  threshold - simple, fast, no AI model involved.
- Diagnosis: when an engine crosses the risk threshold, an AI agent reviews
  its current state and recent history to write a short, plain-language
  explanation for a technician, including whether this looks like a
  recurring issue.
- Planning: assigns an available repair crew to the engine, or queues it if
  every crew is currently busy, prioritizing by estimated cost of delay.
- Reporting: at the end of each simulated month, an AI agent reviews that
  month's events and compares them to the prior month to write a short
  executive summary.

The Diagnosis and Reporting agents use a real language model; Monitoring
and the crew-assignment logic are plain rule-based code, not AI-driven -
this keeps the fast, frequent decisions cheap and instant, while reserving
AI for the parts that genuinely benefit from natural-language synthesis.
```

---

## Placement & Tone Notes for the Frontend

- Identical placement/pattern to the Bearing version - same collapsed panel
  or `[i] About` icon, same location relative to the sim clock.
- When the dataset toggle switches between Bearing and Turbofan, this panel's
  content should swap accordingly (this file for Turbofan, the Bearing
  version for Bearing) - it is not shared/generic text, since the dataset,
  fault framing, and honesty caveats genuinely differ between the two.
- Do not duplicate this content elsewhere on the page - link/point to this
  panel instead, keep the disclaimer authoritative and in one place.
