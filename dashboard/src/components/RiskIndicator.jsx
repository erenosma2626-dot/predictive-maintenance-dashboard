import React from 'react';
import './RiskIndicator.css';
import { useLanguage } from '../contexts/LanguageContext';

const RiskIndicator = ({ data, dataset }) => {
  const { t } = useLanguage();
  const prob = data.maintenance_probability;
  const segments = 20; // Number of blocks in the bar
  const filledSegments = Math.round(prob * segments);

  const stageFraction = data.cycle / data.engine_total_lifespan;
  const confidence = stageFraction >= 0.8 ? t('live.conf_high') : t('live.conf_low');

  return (
    <div className="panel risk-panel">
      <span className="section-label">{t('live.system_risk')}</span>
      
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
            {prob >= 0.75 ? t('live.risk_critical') : t('live.risk_nominal')}
          </div>
          <div className="confidence-label">
            {t('live.model_reliability')}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskIndicator;
