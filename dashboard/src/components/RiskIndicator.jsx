import React from 'react';
import './RiskIndicator.css';

const RiskIndicator = ({ data }) => {
  const prob = data.maintenance_probability;
  const segments = 20; // Number of blocks in the bar
  const filledSegments = Math.round(prob * segments);

  const stageFraction = data.cycle / data.engine_total_lifespan;
  const confidence = stageFraction >= 0.8 ? "CONFIDENCE: HIGH" : "CONFIDENCE: LOW (early-stage, unvalidated)";

  return (
    <div className="panel risk-panel">
      <span className="section-label">SYSTEM RISK LEVEL</span>
      
      <div className="risk-value">
        {prob.toFixed(2)}
      </div>

      <div className="segmented-bar">
        {Array.from({ length: segments }).map((_, i) => {
          const isFilled = i < filledSegments;
          // Calculate opacity based on probability (higher prob = more solid amber)
          const opacity = isFilled ? 0.2 + (prob * 0.8) : 0.05;
          return (
            <div 
              key={i} 
              className={`segment ${isFilled ? 'filled' : ''}`}
              style={{ backgroundColor: isFilled ? `rgba(212, 145, 74, ${opacity})` : 'var(--bg-color)' }}
            />
          );
        })}
      </div>

      <div className="confidence-label">
        {confidence}
      </div>
    </div>
  );
};

export default RiskIndicator;
