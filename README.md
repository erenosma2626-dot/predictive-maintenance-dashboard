# Predictive Maintenance Dashboard — NASA C-MAPSS & IMS Bearing Datasets

**Live demo:** https://predictive-maintenance-dashboard-git-main-eren25.vercel.app

A live, explainable predictive maintenance system built on NASA's C-MAPSS turbofan engine degradation dataset and the IMS Bearing dataset — designed around one non-negotiable rule: **never claim more certainty than the data actually supports.**

---

## What This Is

A synthetic stream of industrial data (turbofan engines or rolling bearings) runs live, tick by tick. A trained model flags whether it likely needs maintenance soon, explains *why* (using SHAP for C-MAPSS, or explicit metric envelopes for bearings), and every number on screen — including the business case — is traceable back to a documented, honestly-validated result. Nothing here is a polished sales pitch; it's an instrument panel.

---

## The Core Finding (Read This First)

Most published work on these datasets reports strong-looking accuracy — but almost
always measured **retrospectively**: given a unit's full observed history, how
well can the model describe its current state? That's a meaningfully easier problem
than the one that actually matters for maintenance planning: *if we only had early
data on a brand-new unit, would we catch a real problem in time?*

### C-MAPSS (Jet Engines) Evaluation
We tested the C-MAPSS model explicitly under genuine early-life evaluation:

| Evaluation | Recall |
|---|---|
| NASA's official test set (engines truncated at NASA's own, often late-stage, cutoff points) | **0.938** |
| Fixed cutoff at 20% of average engine lifespan | 0.000 |
| Fixed cutoff at 40% | 0.000 |
| Fixed cutoff at 60% | 0.000 |
| Fixed cutoff at 80% | 0.206 |
| Fixed cutoff at 100% (full average lifespan) | 0.213 |

Recall never exceeds ~0.28 under genuine early/mid-life evaluation — even with a
full average lifespan of data. This model is a reliable *low-false-alarm, late-stage* signal. It is not a genuine early-warning system.

### IMS Bearing Evaluation
Similarly, for the Rexnord bearings, reliability varies by physical unit. Roughly half show a clean quiet-early/sharp-late-alarm pattern, while the rest are noisier throughout their recorded life. Averaging this away into a single score hides the reality of the model's inconsistency across physical units. 

The dashboard says all of this out loud, at all times.

---

## Methodology & Validation

### Datasets
1. **NASA C-MAPSS (FD001)**: 100 training engines (full run-to-failure) and 100
test engines (truncated), single operating condition, single fault mode (HPC degradation). 14 active sensors used out of 21.
2. **IMS Bearing Dataset**: 3 test-to-failure experiments (12 bearings total), 2000 RPM constant speed, 6000 lb radial load, ~20kHz sampling.

### Features
**For C-MAPSS:**
- **`_rm`** — 10-cycle rolling mean
- **`_trend`** — expanding-window linear slope
- **`_dev`** — baseline deviation
(42 features total feed the Random Forest Classifier).

**For Bearings:**
- **RMS (Root Mean Square)** — Rolling-smoothed over 20 files, normalized to early-life baseline to capture vibration strength.
- **Kurtosis** — Smoothed/normalized to capture the impulsiveness/sharpness of the vibration pattern.

### Models & Leak-Proofing
**C-MAPSS:** Random Forest Classifier predicting whether RUL is ≤ 20 cycles. Unit-based train/validation split ensures no leakage across engines. NASA's official test set is entirely disjoint.
**Bearings:** Random Forest Classifier validated via strict **Leave-one-bearing-out (12 folds)** cross-validation. Every bearing is evaluated as a completely held-out unit, never trained on itself.

Both models discarded overly-complex approaches (tsfresh automated feature explosion, Continuous RUL regression, GMM-HMM) that caused severe overfitting or degraded accuracy on small datasets.

### Explainability & Business Value
- **Explainability:** Per-prediction SHAP values (for Jet Engines) identify which specific features drove each individual alert, surfaced live on the dashboard. 
- **Business Framing:** The model's confusion matrix is translated into an Expected Value (cost-benefit) comparison against 'Reactive' and 'Preventive' strategies.

---

## Sources & Prior Work Consulted

This project was built by reviewing existing public approaches, compiled in the **Literature Resources** page of the dashboard:
- Saxena et al. (2008) — Origin of the C-MAPSS dataset.
- Coble & Hines (2009) — Prognostic parameter selection (Monotonicity, Trendability).
- Various Kaggle/GitHub implementations of Random Forest, XGBoost, and LSTM applied to C-MAPSS.
- Qiu et al. (2006) — Wavelet filter-based weak signature detection for bearings.

Where published results elsewhere look substantially better, it is almost always due to **retrospective evaluation metrics** or evaluation on overlapping train/test splits.

---

## Tech Stack

- **Model & analysis:** Python, scikit-learn, SHAP, pandas/numpy
- **Backend:** FastAPI (live tick loop, REST + WebSocket)
- **Database:** Supabase (Postgres) — persists current state + history so the dashboard shows the same live state to every visitor, survives page refreshes
- **Frontend:** React + Vite, Three.js (dynamic 3D digital twins for both Jet Engine and Rolling Bearing), i18n (English/Turkish localization)
- **Hosting:** Render (backend), Vercel (frontend)

---

## Known Limitations

- Small sample sizes: n=100 training engines (C-MAPSS), n=12 bearings (IMS Bearing).
- Precision is strong throughout; recall is strong only at late-stage evaluation and weak at genuine early/mid-life cutoffs.
- Dollar figures in the business-value framework are illustrative.
- Synthetic streams are parametric bootstraps of real unit trajectories — used only to drive the live demo, never used to report model performance.

---

## Roadmap

- [x] Additional datasets (bearing degradation) under the same validation discipline, selectable via a dataset-switcher UI, complete with dedicated Synthetic Data visualizations and dynamic 3D digital twins.
- [x] Full i18n (English/Turkish) localization with a live context-based language switcher.
- [x] Literature Resources page compiling generalized lessons from academic sources.
- [ ] Additional datasets (milling tool wear).
- [ ] Sequence-aware modeling (LSTM/GRU) to test whether the early-warning ceiling is a model-class limitation rather than a feature limitation.
