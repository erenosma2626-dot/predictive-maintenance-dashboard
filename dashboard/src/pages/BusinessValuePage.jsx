import React from 'react';
import './BusinessValuePage.css';

const BusinessValuePage = () => {
  return (
    <div className="bv-page fade-in">
      <div className="panel chart-panel">
        <span className="section-label">EXPECTED VALUE GENERATED (VS REACTIVE BASELINE)</span>
        
        <div className="bar-chart-container">
          <div className="chart-bars">
            {/* Reactive */}
            <div className="bar-group">
              <div className="bar reactive" style={{ height: '5%' }}>
                <span className="bar-label">$0</span>
              </div>
              <span className="bar-title">REACTIVE</span>
            </div>
            
            {/* Preventive */}
            <div className="bar-group">
              <div className="bar preventive" style={{ height: '75%' }}>
                <span className="bar-label">+$1.66M</span>
              </div>
              <span className="bar-title">PREVENTIVE</span>
            </div>

            {/* Model */}
            <div className="bar-group">
              <div className="bar model" style={{ height: '90%' }}>
                <span className="bar-label text-accent">+$1.94M</span>
              </div>
              <span className="bar-title text-accent">MODEL</span>
            </div>
          </div>
        </div>

        <div className="sensitivity-note">
          Ranking robust across FN cost -$40K to -$150K
        </div>
      </div>

      <div className="panel methodology-panel">
        <span className="section-label">METHODOLOGY & SOURCING</span>
        <div className="methodology-content">
          <p>
            The values above are derived using an expected value framework based on the following illustrative placeholder costs:
          </p>
          <ul>
            <li>True Positive (TP) Benefit: <strong>$50,000</strong> (Saved secondary damage minus intervention cost)</li>
            <li>False Positive (FP) Cost: <strong>-$5,000</strong> (Wasted inspection/early maintenance)</li>
            <li>False Negative (FN) Cost: <strong>-$80,000</strong> (Run-to-failure catastrophic damage)</li>
            <li>True Negative (TN) Value: <strong>$0</strong></li>
          </ul>
          <p className="mt-1">
            <strong>Sources:</strong><br/>
            1. Cost-benefit methodology inspired by the "Damage Propagation Modeling" Kaggle notebook and "Data Science for Business".<br/>
            2. Performance figures are extracted from the official C-MAPSS FD001 test split evaluations as detailed in the project notebook.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessValuePage;
