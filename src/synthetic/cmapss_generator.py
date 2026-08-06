
"""Synthetic C-MAPSS engine generator and live streaming interface."""
import numpy as np
import pandas as pd


def generate_synthetic_engine(train_df, sensors, life_stretch_std=0.10, noise_std=0.02, seed=None):
    rng = np.random.default_rng(seed)
    template_unit = rng.choice(train_df["unit_number"].unique())
    template = train_df[train_df["unit_number"] == template_unit].sort_values("time_in_cycles").reset_index(drop=True)

    stretch = np.clip(1.0 + rng.normal(0, life_stretch_std), 0.6, 1.6)
    n_cycles = max(int(len(template) * stretch), 30)

    old_idx = np.linspace(0, len(template) - 1, len(template))
    new_idx = np.linspace(0, len(template) - 1, n_cycles)

    synth = pd.DataFrame({"time_in_cycles": np.arange(1, n_cycles + 1)})
    for s in sensors:
        interpolated = np.interp(new_idx, old_idx, template[s].values)
        noise = rng.normal(0, noise_std * (template[s].std() + 1e-6), size=n_cycles)
        synth[s] = interpolated + noise
    return synth, template_unit


def make_plausibility_filter(train_df, sensors):
    real_lifespans = train_df.groupby("unit_number")["time_in_cycles"].max()
    life_min, life_max = real_lifespans.min() * 0.8, real_lifespans.max() * 1.2
    real_ranges = {s: (train_df[s].min(), train_df[s].max()) for s in sensors}

    def is_plausible(synth_df):
        if not (life_min <= len(synth_df) <= life_max):
            return False
        for s in sensors:
            lo, hi = real_ranges[s]
            margin = (hi - lo) * 0.3
            if synth_df[s].min() < lo - margin or synth_df[s].max() > hi + margin:
                return False
        return True

    return is_plausible


class SyntheticEngineStream:
    """Stateful, tick-based synthetic engine stream with live model inference."""

    def __init__(self, train_df, sensors, feature_cols, model, seed=0):
        self.train_df = train_df
        self.sensors = sensors
        self.feature_cols = feature_cols
        self.model = model
        self.rng_seed = seed
        self.is_plausible = make_plausibility_filter(train_df, sensors)
        self._start_new_engine()

    def _start_new_engine(self):
        while True:
            synth, src = generate_synthetic_engine(self.train_df, self.sensors, seed=self.rng_seed)
            self.rng_seed += 1
            if self.is_plausible(synth):
                self.current_engine = synth
                self.current_source = src
                self.cycle_idx = 0
                break

    def tick(self):
        if self.cycle_idx >= len(self.current_engine):
            self._start_new_engine()

        window = self.current_engine.iloc[: self.cycle_idx + 1]
        row = window.iloc[-1].to_dict()

        feats = {}
        for s in self.sensors:
            vals = window[s].values
            cycles = window["time_in_cycles"].values
            feats[s] = vals[-1]
            feats[f"{s}_rm"] = vals[-10:].mean()
            feats[f"{s}_dev"] = vals[-1] - vals[0]
            feats[f"{s}_trend"] = np.polyfit(cycles, vals, 1)[0] if len(vals) > 1 else 0.0

        X = pd.DataFrame([feats])[self.feature_cols]
        proba = self.model.predict_proba(X)[0, 1]
        pred = int(proba >= 0.5)

        self.cycle_idx += 1

        return {
            "engine_source_unit": int(self.current_source),
            "cycle": int(row["time_in_cycles"]),
            "engine_total_lifespan": len(self.current_engine),
            "sensors": {s: round(row[s], 3) for s in self.sensors},
            "maintenance_flag": pred,
            "maintenance_probability": round(float(proba), 3),
        }


def explain_prediction(explainer, X_row, feature_names, top_n=3):
    """Return top-N SHAP-contributing features for a single prediction row."""
    shap_vals = explainer.shap_values(X_row)
    contributions = shap_vals[0, :, 1]
    contrib_df = pd.DataFrame({"feature": feature_names, "shap_value": contributions})
    return contrib_df.sort_values("shap_value", key=abs, ascending=False).head(top_n)


def format_alert_message(engine_id, cycle, total_lifespan, probability, top_features_df):
    risk_level = "HIGH" if probability >= 0.7 else "MODERATE" if probability >= 0.3 else "LOW"
    lines = [
        f"ALERT — Engine {engine_id}, Cycle {cycle}/{total_lifespan}",
        f"Risk probability: {probability:.2f} ({risk_level})",
        "",
    ]
    direction_word = lambda v: "elevated" if v > 0 else "suppressed"
    primary = top_features_df.iloc[0]
    lines.append(
        f"Primary contributing signal: {primary[\'feature\']} "
        f"({primary[\'shap_value\']:+.3f} SHAP contribution, {direction_word(primary[\'shap_value\'])} risk)"
    )
    if len(top_features_df) > 1:
        secondary = top_features_df.iloc[1]
        lines.append(f"Secondary: {secondary[\'feature\']} ({secondary[\'shap_value\']:+.3f})")
    lines.append("")
    stage_fraction = cycle / total_lifespan
    confidence = "validated (late-stage)" if stage_fraction >= 0.8 else "unvalidated (early/mid-stage)"
    lines.append(
        f"Confidence basis: {confidence}. Model precision ~0.94 at validated stages; "
        f"early-stage reliability not established below ~80% of typical service life."
    )
    return "\n".join(lines)


class SyntheticEngineStreamWithExplain(SyntheticEngineStream):
    """SyntheticEngineStream extended with per-tick SHAP explanations."""

    def __init__(self, train_df, sensors, feature_cols, model, explainer, seed=0):
        self.explainer = explainer
        super().__init__(train_df, sensors, feature_cols, model, seed=seed)

    def tick(self):
        base_result = super().tick()
        window = self.current_engine.iloc[: self.cycle_idx]
        feats = {}
        for s in self.sensors:
            vals = window[s].values
            cycles = window["time_in_cycles"].values
            feats[s] = vals[-1]
            feats[f"{s}_rm"] = vals[-10:].mean()
            feats[f"{s}_dev"] = vals[-1] - vals[0]
            feats[f"{s}_trend"] = np.polyfit(cycles, vals, 1)[0] if len(vals) > 1 else 0.0
        X_full = pd.DataFrame([feats])[self.feature_cols]

        top_feats = explain_prediction(self.explainer, X_full, self.feature_cols, top_n=2)
        message = format_alert_message(
            engine_id=f"SYN-{base_result[\'engine_source_unit\']}",
            cycle=base_result["cycle"],
            total_lifespan=base_result["engine_total_lifespan"],
            probability=base_result["maintenance_probability"],
            top_features_df=top_feats,
        )
        base_result["explanation"] = {
            "top_features": top_feats.to_dict("records"),
            "message": message,
        }
        return base_result
