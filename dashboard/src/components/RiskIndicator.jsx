import React from 'react';
import './RiskIndicator.css';

const RiskIndicator = ({ data, dataset }) => {
  const prob = data.maintenance_probability;
  const segments = 20; // Number of blocks in the bar
  const filledSegments = Math.round(prob * segments);

  const stageFraction = data.cycle / data.engine_total_lifespan;
  const confidence = stageFraction >= 0.8 ? "CONFIDENCE: HIGH" : "CONFIDENCE: LOW (early-stage, unvalidated)";

  return (
    <div className="panel risk-panel">
      <span className="section-label">SYSTEM RISK LEVEL</span>
      
      {dataset === 'cmapss' ? (
        <>
          <div className="risk-value">
            {prob.toFixed(2)}
          </div>

          <div className="segmented-bar">
            {Array.from({ length: segments }).map((_, i) => {
              const isFilled = i < filledSegments;
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
        </>
      ) : (
        <div className="bearing-risk-container">
          <div className={`alert-button ${prob >= 0.75 ? 'critical' : 'nominal'}`}>
            <div className="alert-circle"></div>
          </div>
          <div className="alert-status">
            {prob >= 0.75 ? 'RISK: CRITICAL' : 'RISK: NOMINAL'}
          </div>
          <div className="confidence-label">
            MODEL RELIABILITY: VARIES BY UNIT — SEE DEEP-DIVE
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskIndicator;
