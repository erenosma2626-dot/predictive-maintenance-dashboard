import React from 'react';
import './FactorsPanel.css';

const FactorsPanel = ({ data, isAlert }) => {
  const { top_features, message } = data.explanation;

  if (isAlert) {
    return (
      <div className="panel factors-panel alert-state">
        <span className="section-label text-accent">ALERT MESSAGE</span>
        <div className="alert-message">
          {message.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              <br/>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="panel factors-panel default-state">
      <div className="factors-grid">
        <div className="factor-cell">
          <span className="section-label">1st FACTOR</span>
          <div className="factor-content">
            {top_features[0]?.feature} 
            <span className="factor-dir">{top_features[0]?.shap_value > 0 ? '↑' : '↓'}</span>
          </div>
        </div>
        <div className="factor-cell">
          <span className="section-label">2nd FACTOR</span>
          <div className="factor-content">
            {top_features[1]?.feature}
            <span className="factor-dir">{top_features[1]?.shap_value > 0 ? '↑' : '↓'}</span>
          </div>
        </div>
        <div className="factor-cell empty"></div>
        <div className="factor-cell empty"></div>
      </div>
    </div>
  );
};

export default FactorsPanel;
