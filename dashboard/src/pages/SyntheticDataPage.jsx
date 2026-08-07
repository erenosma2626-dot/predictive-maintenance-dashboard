import React from 'react';
import bearingTemplates from '../data/bearing_templates.json';
import './SyntheticDataPage.css';

const ChartPanel = ({ featureKey, title, maxVal, history }) => {
  const width = 800;
  const height = 150;

  // Extract templates
  const { life_pct, mean, std } = bearingTemplates;
  const featureMean = mean[featureKey];
  const featureStd = std[featureKey];

  // Helper to map values to SVG coordinates
  const getXTemplate = (pct) => (pct / 100) * width; // For template (0-100)
  const getXHistory = (pct) => pct * width; // For history (0-1)
  const getY = (val) => height - (Math.min(val, maxVal) / maxVal) * height;

  // Create path for the standard deviation band
  let bandPath = '';
  if (life_pct.length > 0) {
    const upperPath = life_pct.map((pct, i) => `${i === 0 ? 'M' : 'L'} ${getXTemplate(pct)} ${getY(featureMean[i] + featureStd[i])}`).join(' ');
    const lowerPath = [...life_pct].reverse().map((pct, i) => `L ${getXTemplate(pct)} ${getY(featureMean[life_pct.length - 1 - i] - featureStd[life_pct.length - 1 - i])}`).join(' ');
    bandPath = `${upperPath} ${lowerPath} Z`;
  }

  // Create path for the mean line
  const meanPath = life_pct.map((pct, i) => `${i === 0 ? 'M' : 'L'} ${getXTemplate(pct)} ${getY(featureMean[i])}`).join(' ');

  // Create path for the live history
  const historyPath = history.map((d, i) => {
    const pct = d.life_pct || 0;
    const val = d.sensors ? d.sensors[featureKey] : 0;
    return `${i === 0 ? 'M' : 'L'} ${getXHistory(pct)} ${getY(val)}`;
  }).join(' ');

  return (
    <div className="synth-chart">
      <span className="synth-chart-title">{title}</span>
      <div className="synth-svg-container">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="synth-svg">
          {/* Std Band */}
          <path d={bandPath} className="synth-band" />
          
          {/* Mean Line */}
          <path d={meanPath} className="synth-mean" />
          
          {/* Live Stream Line */}
          {historyPath && <path d={historyPath} className="synth-live" />}
        </svg>
        
        {/* Y-axis labels */}
        <div className="y-label top">{maxVal}x</div>
        <div className="y-label bottom">0x</div>
      </div>
      {/* X-axis labels */}
      <div className="x-axis">
        <span>0% Life</span>
        <span>50% Life</span>
        <span>100% Life</span>
      </div>
    </div>
  );
};

const SyntheticDataPage = ({ dataset, currentData, history }) => {
  if (dataset !== 'bearing') return null;

  return (
    <div className="synth-page fade-in">
      
      {/* Section 1 - How it's built */}
      <div className="panel synth-section">
        <span className="section-label">GENERATION METHOD</span>
        <div className="synth-content">
          <p className="synth-desc">
            Each of the 12 real bearings' recorded lifetime was resampled onto a common 
            0–100% life-percentage axis, then averaged into a single "prototype" curve 
            (with its natural spread preserved as a ± band). The live stream is this 
            average curve plus randomized noise scaled to that natural spread — not a 
            copy of any single real bearing, and not pure randomness either.
          </p>
        </div>
      </div>

      {/* Section 2 - Why it's a reasonable stand-in */}
      <div className="panel synth-section">
        <span className="section-label">WHY TRUST THIS STREAM?</span>
        <div className="synth-content">
          <ul className="checklist">
            <li>Built from real, physical bearing failures — not invented from scratch</li>
            <li>Preserves the natural bearing-to-bearing variability (the +/- band), so the stream doesn't look artificially "too clean"</li>
            <li>Every tick is scored by the same model validated in the Dataset Deep-Dive page — the risk logic you see live is the same logic that was tested against real held-out bearings</li>
          </ul>
        </div>
      </div>

      {/* Section 3 - Live comparison (Centerpiece) */}
      <div className="panel synth-section comparison-panel">
        <span className="section-label text-accent">LIVE COMPARISON: SYNTHETIC VS. REAL ENVELOPE</span>
        <div className="synth-content charts-container">
          <ChartPanel 
            featureKey="rms_rm_norm" 
            title="VIBRATION INTENSITY (RMS)" 
            maxVal={4} 
            history={history} 
          />
          <ChartPanel 
            featureKey="kurtosis_rm_norm" 
            title="IMPACT SHARPNESS (KURTOSIS)" 
            maxVal={6} 
            history={history} 
          />
        </div>
      </div>

      {/* Section 4 - What this is / isn't */}
      <div className="panel synth-section synth-footer">
        <div className="synth-content">
          <p>
            <strong>WHAT THIS STREAM IS FOR:</strong> demonstrating the live risk-scoring pipeline end to end, and stress-testing how the model behaves across a full lifecycle.
          </p>
          <p className="mt-1">
            <strong>WHAT IT IS NOT:</strong> a substitute for the per-bearing validation shown in the Dataset Deep-Dive page. Real bearings vary — some show a clean early-quiet / late-alarm pattern, others don't (see the 12-bearing grid).
          </p>
        </div>
      </div>

    </div>
  );
};

export default SyntheticDataPage;
