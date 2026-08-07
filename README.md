# Predictive Maintenance Dashboard — NASA C-MAPSS & IMS Bearing Datasets

**Live demo:** https://predictive-maintenance-dashboard-git-main-eren25.vercel.app

A live, explainable predictive maintenance system built on NASA's C-MAPSS turbofan engine degradation dataset and the IMS Bearing dataset — designed around one non-negotiable rule: **never claim more certainty than the data actually supports.**

---

## What This Is

A synthetic stream of industrial data (turbofan engines or rolling bearings) runs live, tick by tick. A trained model flags whether it likely needs maintenance soon, explains *why* (using SHAP for C-MAPSS, or explicit metric envelopes for bearings), and every number on screen — including the business case — is traceable back to a documented, honestly-validated result. Nothing here is a polished sales pitch; it's an instrument panel.

---

## The Core Finding (Read This First)

Most published work on this dataset reports strong-looking accuracy — but almost
always measured **retrospectively**: given an engine's full observed history, how
well can the model describe its current state? That's a meaningfully easier problem
than the one that actually matters for maintenance planning: *if we only had early
data on a brand-new engine, would we catch a real problem in time?*

We tested both, explicitly:

| Evaluation | Recall |
|---|---|
| NASA's official test set (engines truncated at NASA's own, often late-stage, cutoff points) | **0.938** |
| Fixed cutoff at 20% of average engine lifespan | 0.000 |
| Fixed cutoff at 40% | 0.000 |
| Fixed cutoff at 60% | 0.000 |
| Fixed cutoff at 80% | 0.206 |
| Fixed cutoff at 100% (full average lifespan) | 0.213 |

Recall never exceeds ~0.28 under genuine early/mid-life evaluation — even with a
full average lifespan of data. Five separate interventions were tried to close this
gap (probability threshold tuning, regression-based flagging, aggressive class
weighting, raw-sensor-only features, looser RUL thresholds, hand-engineered trend/
deviation features, and automated `tsfresh` feature extraction) — **none moved the
needle.** This model is a reliable *low-false-alarm, late-stage* signal. It is not a
genuine early-warning system, and the dashboard says so, out loud, at all times.

---

## Methodology & Validation

### Dataset
NASA C-MAPSS, subset **FD001**: 100 training engines (full run-to-failure) and 100
test engines (truncated, with ground-truth RUL from `RUL_FD001.txt`), single
operating condition, single fault mode (HPC degradation). 21 onboard sensors; 7 are
constant across all engines and were dropped, leaving **14 active sensors**:
`s_2, s_3, s_4, s_7, s_8, s_9, s_11, s_12, s_13, s_14, s_15, s_17, s_20, s_21`.

### Features
For each active sensor, three engineered features were computed as row-level,
expanding-window statistics (using only data observed up to that point — no future
leakage):
- **`_rm`** — 10-cycle rolling mean, smooths sensor noise
- **`_trend`** — expanding-window linear slope vs. cycle number, captures the
  direction/speed of change
- **`_dev`** — current value minus that engine's own first observed value,
  normalizes for engine-to-engine manufacturing variation

42 features total (14 sensors × 3 derived statistics) feed the final model.
Automated feature extraction via `tsfresh` (140 additional candidates) was tested
and discarded — the best automated feature offered no meaningful improvement over
the hand-built set and cost significant interpretability.

### Model
**Random Forest Classifier** (`class_weight="balanced"`), predicting whether an
engine's remaining useful life is ≤ 20 cycles ("needs maintenance soon"). Chosen
over a Cox proportional-hazards approach because C-MAPSS training data contains no
censoring (every training engine runs to actual failure) — the survival-analysis
machinery that matters for censored data isn't needed here.

### Leak-Proofing (five independent checks)
1. **Unit-based train/validation split** — split by `unit_number`, never by row, so
   no engine's cycles appear on both sides.
2. **Direct overlap audit** — `len(train_units ∩ val_units) == 0`, verified in code,
   not assumed.
3. **NASA's official, file-separate test set** — evaluated on `test_FD001.txt` +
   `RUL_FD001.txt`, which share zero engines with the training file by construction.
4. **Matched train/test feature windowing** — an early version of the trend/
   deviation features was computed over full lifetimes at train time but partial
   windows at test time, silently producing a degenerate, always-positive
   classifier. Caught via a distribution-range check on the `_dev` feature, then
   fixed by computing both identically.
5. **Independent fixed-cutoff scan** — recall re-measured at cutoffs *we* chose
   (20/40/60/80/100% of average lifespan), not just NASA's own truncation points —
   this is what surfaced the honest early-warning ceiling above.

### Business framing (Expected Value)
Rather than optimizing RMSE/accuracy in isolation, the classifier's confusion
matrix is translated into a cost-benefit comparison (methodology adapted from a
reviewed open-source notebook applying the *Data Science for Business* cost-benefit
framework — see Sources):

| Strategy | Expected Value |
|---|---|
| Reactive (never flag, wait for failure) | **-$1,280,000** |
| Preventive (always flag, maintain everyone) | $380,000 |
| **This model** | **$660,000** |

Dollar assumptions (TP/FP/FN/TN costs) are illustrative placeholders, not calibrated
to a real operator — but a sensitivity sweep across a 4x range of false-negative
cost (-$40K to -$150K) confirms the *ranking* (model > preventive > reactive) holds
in every case tested.

### Explainability
Per-prediction SHAP (`TreeExplainer`) values identify which specific features drove
each individual alert — not just global feature importance. The two highest-
contributing features are surfaced live for every tick; a full formatted
explanation (signal, contribution magnitude, direction, confidence basis) is
generated automatically when risk crosses the alert threshold.

---

## Sources & Prior Work Consulted

This project was built by first reviewing existing public approaches to this
dataset and this class of problem, and being explicit about what was adopted,
adapted, or rejected:

- Saxena, A., Goebel, K., Simon, D., & Eklund, N. (2008). *Damage propagation
  modeling for aircraft engine run-to-failure simulation.* International Conference
  on Prognostics and Health Management (PHM08) — origin of the C-MAPSS dataset and
  the asymmetric competition scoring function adopted here.
- A publicly available Kaggle notebook combining Random Forest/XGBoost RUL
  regression with a per-engine "stage-matched" retraining technique and a
  Data-Science-for-Business-style expected-value framework — the direct inspiration
  for this project's business-value layer.
- A publicly available LSTM-based binary classification notebook on the same
  dataset — reviewed for its windowed sequence-labeling approach; informed (by
  contrast) the decision to explicitly separate retrospective from prospective
  evaluation here.
- An SVR-based regression notebook on the same dataset — its row-level
  `train_test_split` (a leakage bug) directly motivated the leak-proofing checklist
  above.
- Peer-reviewed literature on tool-wear and turbofan RUL prediction (including
  frequency-domain feature extraction and deep recurrent architectures) was
  reviewed for feature-engineering and evaluation-protocol ideas during an earlier,
  related phase of this project on a separate dataset (PHM2010 milling).

Where published results elsewhere look substantially better than what's reported
here, the most common reason — checked directly against several of the sources
above — is evaluation timing: retrospective/full-history metrics, or NASA's own
(often late-stage) test truncation points, rather than genuine early-life
evaluation.

---

## Tech Stack

- **Model & analysis:** Python, scikit-learn, SHAP, pandas/numpy
- **Backend:** FastAPI (live tick loop, REST + WebSocket)
- **Database:** Supabase (Postgres) — persists current state + history so the dashboard shows the same live state to every visitor, survives page refreshes
- **Frontend:** React + Vite, Three.js (dynamic 3D digital twins for both Jet Engine and Rolling Bearing)
- **Hosting:** Render (backend), Vercel (frontend)

---

## Known Limitations

- n=100 training engines, single operating condition (FD001 only)
- Precision is strong (~0.94) throughout; recall is strong only at late-stage
  evaluation (~0.94 at NASA's own cutoffs) and weak at genuine early/mid-life
  cutoffs (~0.20-0.28)
- Dollar figures in the business-value framework are illustrative, not calibrated
  to a real operator's costs
- Synthetic engine streams are parametric bootstraps of real engine trajectories
  (with plausibility filtering) — used only to drive the live demo, never used to
  report model performance

---

## Roadmap

- [x] Additional datasets (bearing degradation) under the same validation discipline, selectable via a dataset-switcher UI, complete with dedicated Synthetic Data visualizations and dynamic 3D digital twins.
- [ ] Additional datasets (milling tool wear).
- [ ] Sequence-aware modeling (LSTM/GRU) to test whether the early-warning ceiling is a model-class limitation rather than a feature limitation.
