export class MockDataStream {
  constructor() {
    this.engineId = Math.floor(Math.random() * 100) + 1;
    this.totalLifespan = Math.floor(Math.random() * 100) + 130; // 130 to 230
    this.cycle = 1;
    
    // Baseline sensors
    this.sensors = {
      s_2: 641.8, s_3: 1580.0, s_4: 1390.0, s_7: 554.0, s_8: 2388.0, 
      s_9: 9050.0, s_11: 47.0, s_12: 522.0, s_13: 2388.0, s_14: 8130.0, 
      s_15: 8.4, s_17: 391.0, s_20: 38.9, s_21: 23.3
    };
    
    this.featuresList = ['s_20_trend', 's_17_trend', 's_15_dev', 's_4_rm', 's_7_trend'];
  }

  tick() {
    if (this.cycle >= this.totalLifespan) {
      // Start new engine
      this.engineId = Math.floor(Math.random() * 100) + 1;
      this.totalLifespan = Math.floor(Math.random() * 100) + 130;
      this.cycle = 1;
    }

    const progress = this.cycle / this.totalLifespan;
    
    // Probability starts near 0 and spikes near the end
    // Use an exponential/sigmoid curve approximation
    let probability = 0.01;
    if (progress > 0.85) probability = 0.01 + Math.pow((progress - 0.85) / 0.15, 3) * 0.98;
    else if (progress > 0.6) probability = 0.01 + Math.pow((progress - 0.6) / 0.25, 2) * 0.2;
    
    probability = Math.min(Math.max(probability, 0), 1);
    const flag = probability >= 0.5 ? 1 : 0;

    // Jitter sensors a bit, with degradation
    Object.keys(this.sensors).forEach(key => {
      const jitter = (Math.random() - 0.5) * (this.sensors[key] * 0.002); // 0.2% jitter
      const drift = progress * (this.sensors[key] * 0.001); // 0.1% drift over lifetime
      this.sensors[key] = parseFloat((this.sensors[key] + jitter + drift).toFixed(2));
    });

    const topFeatures = [
      { feature: this.featuresList[Math.floor(Math.random() * this.featuresList.length)], shap_value: -0.048 - (Math.random() * 0.02) },
      { feature: this.featuresList[Math.floor(Math.random() * this.featuresList.length)], shap_value: 0.045 + (Math.random() * 0.02) }
    ];

    let riskLevel = "LOW";
    if (probability >= 0.7) riskLevel = "HIGH";
    else if (probability >= 0.3) riskLevel = "MODERATE";

    const directionWord = topFeatures[0].shap_value > 0 ? "elevated" : "suppressed";
    const stageFraction = progress;
    const confidence = stageFraction >= 0.8 ? "validated (late-stage)" : "unvalidated (early/mid-stage)";

    const message = `ALERT — Engine SYN-${this.engineId}, Cycle ${this.cycle}/${this.totalLifespan}\n` +
      `Risk probability: ${probability.toFixed(2)} (${riskLevel})\n\n` +
      `Primary contributing signal: ${topFeatures[0].feature} ` +
      `(${topFeatures[0].shap_value.toFixed(3)} SHAP contribution, ${directionWord} risk)\n` +
      `Secondary: ${topFeatures[1].feature} (${topFeatures[1].shap_value.toFixed(3)})\n\n` +
      `Confidence basis: ${confidence}. Model precision ~0.94 at validated stages; ` +
      `early-stage reliability not established below ~80% of typical service life.`;

    const result = {
      engine_source_unit: this.engineId,
      cycle: this.cycle,
      engine_total_lifespan: this.totalLifespan,
      sensors: { ...this.sensors },
      maintenance_flag: flag,
      maintenance_probability: parseFloat(probability.toFixed(3)),
      explanation: {
        top_features: topFeatures,
        message: message
      }
    };

    this.cycle += 1;
    return result;
  }
}
