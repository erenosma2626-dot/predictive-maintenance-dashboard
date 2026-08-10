# Fleet Simulation — "About This Page" Content Spec

A short, honest explainer surfaced within the Fleet Simulation tab — either as
a dedicated small sub-page/modal (e.g. reachable via an `[i] About` icon near
the sim clock) or a permanently visible collapsed panel at the bottom of the
page, matching the quiet, monospace, non-intrusive style already used for
similar disclaimers elsewhere in the app (e.g. the Live tab's confidence
captions). This is explanatory content only — no new visual chrome, colors, or
layout system beyond what's already established.

---

## What This Page Is

```
WHAT AM I LOOKING AT?

This is a live simulation of a small fleet of 12 bearings, running
continuously. Each machine ages independently - some degrade quickly, some
slowly - based on statistical patterns learned from 12 real bearings in the
IMS/NASA bearing dataset (the same model validated in the Dataset Deep-Dive
page). When a machine's risk crosses a threshold, an AI agent diagnoses the
likely fault, a repair crew is dispatched, and the outcome (planned repair
vs. unplanned failure) feeds into a running economic tally.

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

This lets a full maintenance cycle - a machine aging, showing early warning
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

This mirrors real published findings on predictive maintenance - for
example, industry reporting on bearing failures has shown a single missed
early-warning signal turning a routine few-hundred-dollar repair into a
production-loss incident costing over 1,000x more. The relative gap in this
simulation (planned vs. unplanned cost) is built to reflect that same kind
of order-of-magnitude difference, not a linear "10% more expensive" penalty.

Important: the specific dollar figures shown are illustrative, not real
repair quotes or real production-loss figures. They are proportionally
realistic - sized to demonstrate the shape of the value predictive
maintenance creates - rather than a literal financial forecast for any real
facility.
```

---

## What the Fault Types Mean (Honesty Note)

```
ABOUT "FAULT TYPES"

Each machine is labeled with a simulated fault type (inner race, outer
race, or roller element defect) to make the 3D diagnosis view and agent
explanations concrete and easy to follow. The underlying risk score
itself is real - produced by a model trained and validated on real
bearing sensor data (see Dataset Deep-Dive). The specific fault type
label, however, is illustrative: it is not derived from a location-specific
signal analysis (that was attempted on the real dataset and found
unreliable - also documented in Dataset Deep-Dive). Treat the fault type as
a demonstration aid for the diagnosis and 3D-highlighting experience, not
as a model-verified finding.
```

---

## What the Agents Actually Do

```
WHAT THE AGENTS DO

- Monitoring: continuously checks every machine's risk level against a
  threshold - simple, fast, no AI model involved.
- Diagnosis: when a machine crosses the risk threshold, an AI agent reviews
  its current state and recent history to write a short, plain-language
  explanation for a technician, including whether this looks like a
  recurring issue.
- Planning: assigns an available repair crew to the machine, or queues it
  if every crew is currently busy, prioritizing by estimated cost of delay.
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

- Keep each section short and scannable - this is reference material a
  curious visitor reads once, not primary UI copy.
- Use the same collapsed/expandable card pattern already used for the
  Dataset Deep-Dive page's panels, so this doesn't require a new UI pattern.
- Do not duplicate this content elsewhere on the page (e.g. don't repeat the
  economics explanation inside the Monthly Reports box) - link/point to this
  panel instead, keep the disclaimer authoritative and in one place.
