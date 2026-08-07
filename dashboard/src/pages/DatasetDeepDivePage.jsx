import React from 'react';
import './DatasetDeepDivePage.css';

const DatasetDeepDivePage = ({ dataset }) => {
  if (dataset === 'bearing') {
    return (
      <div className="dd-page fade-in">
        <div className="dd-grid">
          {/* Dataset Identity */}
          <div className="panel">
            <span className="section-label">DATASET IDENTITY</span>
            <div className="dd-content">
              <p><strong>Name:</strong> IMS/NASA Bearing Dataset</p>
              <p><strong>Source:</strong> Center for Intelligent Maintenance Systems / NASA Ames Prognostics Data Repository</p>
              <p><strong>Data Access:</strong> Raw data (~7GB) not bundled. <a href="#" className="text-accent">Download from source</a></p>
              <p><strong>Details:</strong> 3 test-to-failure experiments (Sets 1, 2, 3)</p>
              <p><strong>Units:</strong> 12 bearings total</p>
              <p><strong>Specs:</strong> Rexnord ZA-2115 double-row bearings, 2000 RPM constant speed, 6000 lb radial load, ~20kHz sampling</p>
            </div>
          </div>

          {/* Feature Engineering */}
          <div className="panel">
            <span className="section-label">FEATURE ENGINEERING</span>
            <div className="dd-content">
              <p><strong>RMS:</strong> "How strong the vibration is". Rolling-smoothed over 20 files, normalized to early-life baseline.</p>
              <p className="mt-1"><strong>Kurtosis:</strong> "How sharp/impulsive the vibration pattern is". Same smoothing/normalization applied.</p>
            </div>
          </div>

          {/* Model Specs */}
          <div className="panel">
            <span className="section-label">MODEL SPECIFICATIONS</span>
            <div className="dd-content">
              <p><strong>Algorithm:</strong> Random Forest Classifier</p>
              <p><strong>Validation:</strong> Leave-one-bearing-out (12 folds)</p>
              <p><strong>Note:</strong> Every bearing is evaluated as a held-out unit, never trained on itself.</p>
            </div>
          </div>

          {/* Discarded */}
          <div className="panel">
            <span className="section-label">DISCARDED APPROACHES</span>
            <div className="dd-content">
              <ul className="discard-list">
                <li>
                  <strong>GMM-HMM:</strong> 
                  <span className="text-muted"> Automatic transition detection. Inconsistent across bearings.</span>
                </li>
                <li>
                  <strong>3-tier health-state:</strong>
                  <span className="text-muted"> Worse performance than simple binary classification.</span>
                </li>
                <li>
                  <strong>Continuous RUL regression:</strong>
                  <span className="text-muted"> Highly unreliable, R² negative in most folds.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Honest Performance Panel */}
        <div className="panel performance-panel">
          <span className="section-label text-accent">HONEST PERFORMANCE: RELIABILITY VARIES BY UNIT</span>
          <div className="performance-content">
            <div className="perf-text" style={{width: '100%', maxWidth: '100%'}}>
              <p>
                Reliability varies by bearing — roughly half show a clean quiet-early/sharp-late-alarm pattern; the rest are noisier throughout their recorded life.
              </p>
              <p className="mt-1 text-accent" style={{fontWeight: 500}}>
                Averaging this away into a single score hides the reality of the model's inconsistency across physical units.
              </p>
              <div className="bearing-grid-placeholder" style={{
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '10px', 
                marginTop: '1.5rem',
                opacity: 0.5
              }}>
                {Array.from({length: 12}).map((_, i) => (
                  <div key={i} style={{border: '1px solid var(--border-color)', padding: '10px', textAlign: 'center', fontSize: '0.8rem'}}>
                    Bearing {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="dd-page fade-in">
      
      <div className="dd-grid">
        {/* Dataset Identity */}
        <div className="panel">
          <span className="section-label">DATASET IDENTITY</span>
          <div className="dd-content">
            <p><strong>Name:</strong> NASA C-MAPSS FD001</p>
            <p><strong>Source:</strong> <a href="#" className="text-accent">NASA Prognostics Data Repository</a></p>
            <p><strong>Training Set:</strong> n=100 engines</p>
            <p><strong>Test Set:</strong> n=100 engines</p>
            <p><strong>Condition:</strong> Single operating condition</p>
            <p><strong>Fault Mode:</strong> HPC degradation</p>
            <p><strong>Sensors:</strong> 21 total (14 active after removing constants)</p>
          </div>
        </div>

        {/* Feature Engineering */}
        <div className="panel">
          <span className="section-label">FEATURE ENGINEERING</span>
          <div className="dd-content">
            <p><strong>Rolling Mean:</strong> Captures the smoothed recent state over a 10-cycle window.</p>
            <p className="mt-1"><strong>Trend:</strong> Linear slope over the rolling window, capturing the rate of degradation.</p>
            <p className="mt-1"><strong>Baseline Deviation:</strong> Difference between current sensor value and its initial cycle value.</p>
          </div>
        </div>

        {/* Model Specs */}
        <div className="panel">
          <span className="section-label">MODEL SPECIFICATIONS</span>
          <div className="dd-content">
            <p><strong>Algorithm:</strong> Random Forest Classifier</p>
            <p><strong>Training Split:</strong> Unit-based (strict engine isolation)</p>
            <p><strong>Leakage Audit:</strong> Passed (No future data contamination in windowing)</p>
            <hr className="subtle-hr" />
            <p className="text-muted mt-1" style={{fontSize: '0.8rem'}}>
              <em>Related Literature Note:</em> Advanced approaches like Deep Layer-Recurrent Neural Networks (DL-RNN) 
              by Thakkar & Chaoui have also been explored on this dataset, demonstrating high prediction accuracy 
              (RMSE 0.12-0.20) for continuous RUL compared to standard MLPs.
            </p>
          </div>
        </div>

        {/* What we tried and discarded */}
        <div className="panel">
          <span className="section-label">DISCARDED APPROACHES</span>
          <div className="dd-content">
            <ul className="discard-list">
              <li>
                <strong>Stage-matched classification:</strong> 
                <span className="text-muted"> Attempted to train separate models per life-stage. Result: Too little data per stage, degraded accuracy.</span>
              </li>
              <li>
                <strong>tsfresh automated features:</strong>
                <span className="text-muted"> Result: Massive feature explosion (1000+) causing severe overfitting. Reverted to domain-specific features.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Honest Performance Panel */}
      <div className="panel performance-panel">
        <span className="section-label text-accent">WHEN DOES THIS MODEL ACTUALLY BECOME RELIABLE?</span>
        <div className="performance-content">
          <div className="perf-chart">
            {/* Simple CSS graph for Recall vs Cutoff */}
            <div className="perf-bar-group">
              <div className="perf-bar" style={{height: '0%'}}></div>
              <span>20%</span>
            </div>
            <div className="perf-bar-group">
              <div className="perf-bar" style={{height: '0%'}}></div>
              <span>40%</span>
            </div>
            <div className="perf-bar-group">
              <div className="perf-bar" style={{height: '0%'}}></div>
              <span>60%</span>
            </div>
            <div className="perf-bar-group">
              <div className="perf-bar" style={{height: '20.6%'}}>
                <span className="perf-val">0.206</span>
              </div>
              <span>80%</span>
            </div>
            <div className="perf-bar-group">
              <div className="perf-bar" style={{height: '21.3%'}}>
                <span className="perf-val">0.213</span>
              </div>
              <span>100%</span>
            </div>
          </div>
          
          <div className="perf-text">
            <p>
              The model's retrospective accuracy is high (94%), but genuine early-warning capability is weak. 
              As shown in the graph (Recall vs. % of Average Lifespan), the model fails to reliably detect 
              imminent failure (Recall ≈ 0) until the engine is past 60% of its typical service life.
            </p>
            <p className="mt-1 text-accent" style={{fontWeight: 500}}>
              Conclusion: Reliable for late-stage flagging, NOT for early prediction.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DatasetDeepDivePage;
