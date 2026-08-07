# Dashboard Frontend Spec — Addendum: "Synthetic Data" Page (Bearing)

This extends `DASHBOARD_SPEC.md` and `DASHBOARD_SPEC_TOGGLE_ADDENDUM.md`. It adds a
**fourth page**, visible only when the toggle is set to Bearing, explaining how the
live stream's data is generated and why it can be trusted as a stand-in for a real
sensor feed.

---

## Navigation Change (Bearing Toggle Position Only)

```
[ LIVE ]   [ SYNTHETIC DATA ]   [ DATASET DEEP-DIVE ]
```

(Business Value stays hidden/placeholder per the earlier addendum. Synthetic Data
is inserted as its own tab rather than buried inside Deep-Dive, because it answers
a different question — "is what I'm watching real?" — that deserves its own space.)

---

## Purpose of This Page

The Live page shows a stream that is **not** real sensor data — it's generated from
a statistical model of the 12 real bearings. This page exists to answer, plainly and
visually, three questions a skeptical visitor would ask:

1. How was this synthetic stream actually built?
2. Why should I believe it behaves like a real bearing?
3. What is it useful for, and what is it *not* a substitute for?

Tone: same "lab notebook, not marketing" register as the rest of the app —
this page should make the person trust the demo *more*, by being upfront about
what it is.

---

## Section 1 — How It's Built (Top of Page)

A short, plain-language explanation, 3–4 sentences, styled as a bordered panel
with a monospace label like `GENERATION METHOD`:

> Each of the 12 real bearings' recorded lifetime was resampled onto a common
> 0–100% life-percentage axis, then averaged into a single "prototype" curve
> (with its natural spread preserved as a ± band). The live stream is this
> average curve plus randomized noise scaled to that natural spread — not a
> copy of any single real bearing, and not pure randomness either.

Directly below the text, show **one static chart**: the same mean ± std-band
chart already produced in the notebook (Section 9, `average_template.png`) —
two stacked panels, one per feature (Vibration Intensity, Impact Sharpness),
x-axis = life percentage. This is the single most important visual on the page:
it makes the "average + spread" explanation concrete instead of abstract.

---

## Section 2 — Why It's a Reasonable Stand-In

A short comparative panel, **not** a new chart — reuse framing from Section 1.
Three short bullet points, styled as a checklist (monospace check markers, same
visual weight as the rest of the app, no icons/emoji):

- Built from real, physical bearing failures — not invented from scratch
- Preserves the natural bearing-to-bearing variability (the +/- band), so the
  stream doesn't look artificially "too clean"
- Every tick is scored by the same model validated in the Dataset Deep-Dive
  page — the risk logic you see live is the same logic that was tested against
  real held-out bearings

---

## Section 3 — Live Comparison: Synthetic vs. the Real Envelope

This is the most useful chart on the page and the one most worth building well.

**Chart:** the mean +/- std band from Section 1 (light, static, background layer),
with the **current live synthetic stream's trajectory so far** overlaid as a
solid line that grows in real time as new ticks arrive (same data source as the
Live page's telemetry stream, just re-plotted against the 0–100% life-axis
instead of scrolling time).

**Why this works:** it visually answers "is the synthetic bearing behaving
like a plausible real one?" at a glance — as long as the live line stays
inside or near the historical band, the stream is behaving credibly; if it
strays far outside the band, that's visible too, and is itself an honest
signal (real bearings vary this much too).

Two curves needed (Vibration Intensity, Impact Sharpness), stacked like
Section 1's chart, sharing the x-axis.

---

## Section 4 — What This Is / Isn't (Closing Panel)

Small, quiet panel at the bottom, same tone as the "Confidence" caption used
elsewhere in the app:

```
WHAT THIS STREAM IS FOR: demonstrating the live risk-scoring pipeline end to
end, and stress-testing how the model behaves across a full lifecycle.

WHAT IT IS NOT: a substitute for the per-bearing validation shown in the
Dataset Deep-Dive page. Real bearings vary — some show a clean early-quiet /
late-alarm pattern, others don't (see the 12-bearing grid).
```

---

## Visual/Layout Summary

Single-column, vertically stacked (no need for the multi-panel grid used on
Live) — this page is meant to be read top-to-bottom once, not glanced at
repeatedly:

1. `GENERATION METHOD` panel (text + static mean+/-band chart)
2. Three-point "why trust it" checklist
3. Live comparison chart (static band + growing live line) — the centerpiece
4. Closing "is/isn't" panel

All charts and panels keep the existing dark background, amber accent,
monospace-label visual system — no new colors, no new chart chrome.

---

## Data Contract

This page needs two data sources, both already produced by the notebook:

- **Static:** `models/bearing_avg_template.csv` and `bearing_std_template.csv`
  (mean and std curves vs. `life_pct`, for `rms_rm_norm` and `kurtosis_rm_norm`)
  — fetched once on page load, doesn't change during the session.
- **Live:** the same tick stream already powering the Live page's telemetry
  chart (`life_pct`, `sensors.rms_rm_norm`, `sensors.kurtosis_rm_norm` per
  tick) — Section 3 just re-renders this against a 0–100% x-axis instead of a
  scrolling time axis, so no new backend endpoint is required, only a second
  chart bound to data already being received.
