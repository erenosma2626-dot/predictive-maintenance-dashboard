import React, { useState } from 'react';
import './DatasetDeepDivePage.css';
import { useLanguage } from '../contexts/LanguageContext';

const DatasetDeepDivePage = ({ dataset }) => {
  const { t } = useLanguage();
  const [selectedUnit, setSelectedUnit] = useState(null);

  if (dataset === 'bearing') {
    return (
      <div className="deepdive-page fade-in">
        {/* HEADER SECTION */}
        <div className="panel header-panel bearing-header">
          <div className="bearing-header-content">
            <div>
              <span className="section-label">{t('deepdive.bearing_title')}</span>
              <h2 className="bearing-title">{t('deepdive.bearing_subtitle')}</h2>
              <p className="deepdive-desc mt-1">
                {t('deepdive.bearing_desc_1')}
              </p>
              <p className="deepdive-desc mt-1">
                {t('deepdive.bearing_desc_2')}
              </p>
            </div>
            <div className="bearing-info-box">
              <p className="deepdive-desc">
                {t('deepdive.bearing_desc_3')}
              </p>
              <ul className="bearing-checklist">
                <li>{t('deepdive.bearing_list_1')}</li>
                <li>{t('deepdive.bearing_list_2')}</li>
                <li>{t('deepdive.bearing_list_3')}</li>
              </ul>
              <p className="text-accent mt-1" style={{fontSize: '0.85rem'}}>
                ► {t('deepdive.bearing_click')}
              </p>
            </div>
          </div>
        </div>

        <div className="dd-grid">
          {/* Dataset Identity */}
          <div className="panel">
            <span className="section-label">{t('deepdive.dataset_identity')}</span>
            <div className="dd-content">
              <p><strong>{t('deepdive.name')}</strong> IMS Bearing Dataset (Rexnord)</p>
              <p><strong>{t('deepdive.source')}</strong> <a href="#" className="text-accent">NASA Prognostics Data Repository</a></p>
              <p><strong>{t('deepdive.details')}</strong> 3 test-to-failure experiments (Sets 1, 2, 3)</p>
              <p><strong>{t('deepdive.units')}</strong> 12 bearings total</p>
              <p><strong>{t('deepdive.specs')}</strong> Rexnord ZA-2115 double-row bearings, 2000 RPM constant speed, 6000 lb radial load, ~20kHz sampling</p>
            </div>
          </div>

          {/* Feature Engineering */}
          <div className="panel">
            <span className="section-label">{t('deepdive.feature_engineering')}</span>
            <div className="dd-content">
              <p><strong>RMS:</strong> "How strong the vibration is". Rolling-smoothed over 20 files, normalized to early-life baseline.</p>
              <p className="mt-1"><strong>Kurtosis:</strong> "How sharp/impulsive the vibration pattern is". Same smoothing/normalization applied.</p>
            </div>
          </div>

          {/* Model Specs */}
          <div className="panel">
            <span className="section-label">{t('deepdive.model_specs')}</span>
            <div className="dd-content">
              <p><strong>{t('deepdive.algorithm')}</strong> Random Forest Classifier</p>
              <p><strong>{t('deepdive.validation')}</strong> Leave-one-bearing-out (12 folds)</p>
              <p><strong>{t('deepdive.note')}</strong> Every bearing is evaluated as a held-out unit, never trained on itself.</p>
            </div>
          </div>

          {/* Discarded */}
          <div className="panel">
            <span className="section-label">{t('deepdive.discarded')}</span>
            <div className="dd-content">
              <ul className="discard-list">
                <li>
                  <strong>{t('deepdive.bearing_discard_1_title')}</strong> 
                  <span className="text-muted"> {t('deepdive.bearing_discard_1_desc')}</span>
                </li>
                <li>
                  <strong>{t('deepdive.bearing_discard_2_title')}</strong>
                  <span className="text-muted"> {t('deepdive.bearing_discard_2_desc')}</span>
                </li>
                <li>
                  <strong>{t('deepdive.bearing_discard_3_title')}</strong>
                  <span className="text-muted"> {t('deepdive.bearing_discard_3_desc')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Honest Performance Panel */}
        <div className="panel performance-panel">
          <span className="section-label text-accent">{t('deepdive.honest_perf_bearing')}</span>
          <div className="performance-content">
            <div className="perf-text" style={{width: '100%', maxWidth: '100%'}}>
              <p>
                {t('deepdive.bearing_perf_text1')}
              </p>
              <p className="mt-1 text-accent" style={{fontWeight: 500}}>
                {t('deepdive.bearing_perf_text2')}
              </p>
              <div className="bearing-grid-container" style={{
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '15px', 
                marginTop: '1.5rem'
              }}>
                {Array.from({length: 12}).map((_, i) => (
                  <div key={i} 
                    style={{
                      border: '1px solid var(--border-color)', 
                      borderRadius: '6px',
                      padding: '10px', 
                      textAlign: 'center', 
                      cursor: 'zoom-in',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      backgroundColor: 'rgba(0,0,0,0.2)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 176, 0, 0.1)';
                      e.currentTarget.style.borderColor = 'var(--accent-color)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                    onClick={() => setSelectedUnit(i + 1)}
                  >
                    <div style={{ fontSize: '0.85rem', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                      {t('deepdive.unit')} {i + 1}
                    </div>
                    <img 
                      src={`/bearing_plot_${i + 1}.png`} 
                      alt={`Unit ${i + 1}`} 
                      style={{
                        width: '100%', 
                        borderRadius: '4px',
                        filter: 'invert(0.85) hue-rotate(180deg) brightness(1.2) contrast(1.1)', 
                      }} 
                    />
                    <div className="enlarge-hint" style={{ fontSize: '0.75rem', marginTop: '5px', color: 'var(--text-muted)' }}>
                      {t('deepdive.bearing_enlarge', 'Click to enlarge')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal for Enlarge Image */}
        {selectedUnit && (
          <div className="modal-overlay fade-in" onClick={() => setSelectedUnit(null)}>
            <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setSelectedUnit(null)}>×</button>
              <h3 className="modal-title">{t('deepdive.unit')} {selectedUnit} — DETAILED VIEW</h3>
              <div className="modal-image-container" style={{ padding: '20px', backgroundColor: '#111', borderRadius: '8px' }}>
                <img 
                  src={`/bearing_plot_${selectedUnit}.png`} 
                  alt={`Unit ${selectedUnit}`} 
                  style={{
                    maxWidth: '100%', 
                    maxHeight: '70vh', 
                    filter: 'invert(0.85) hue-rotate(180deg) brightness(1.2) contrast(1.1)'
                  }}
                />
              </div>
              <div className="modal-legend">
                <span className="legend-item"><span className="legend-dot model-dot"></span> {t('deepdive.model_prediction')}</span>
                <span className="legend-item"><span className="legend-dot signal-dot"></span> {t('deepdive.sensor_signal')}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="deepdive-page fade-in">
      
      <div className="dd-grid">
        {/* Dataset Identity */}
        <div className="panel">
          <span className="section-label">{t('deepdive.dataset_identity')}</span>
          <div className="dd-content">
            <p><strong>{t('deepdive.name')}</strong> NASA C-MAPSS FD001</p>
            <p><strong>{t('deepdive.source')}</strong> <a href="#" className="text-accent">NASA Prognostics Data Repository</a></p>
            <p><strong>{t('deepdive.train_set')}</strong> n=100 engines</p>
            <p><strong>{t('deepdive.test_set')}</strong> n=100 engines</p>
            <p><strong>{t('deepdive.condition')}</strong> Single operating condition</p>
            <p><strong>{t('deepdive.fault_mode')}</strong> HPC degradation</p>
            <p><strong>{t('deepdive.sensors')}</strong> 21 total (14 active after removing constants)</p>
          </div>
        </div>

        {/* Feature Engineering */}
        <div className="panel">
          <span className="section-label">{t('deepdive.feature_engineering')}</span>
          <div className="dd-content">
            <p><strong>Rolling Mean:</strong> Captures the smoothed recent state over a 10-cycle window.</p>
            <p className="mt-1"><strong>Trend:</strong> Linear slope over the rolling window, capturing the rate of degradation.</p>
            <p className="mt-1"><strong>Baseline Deviation:</strong> Difference between current sensor value and its initial cycle value.</p>
          </div>
        </div>

        {/* Model Specs */}
        <div className="panel">
          <span className="section-label">{t('deepdive.model_specs')}</span>
          <div className="dd-content">
            <p><strong>{t('deepdive.algorithm')}</strong> Random Forest Classifier</p>
            <p><strong>Training Split:</strong> Unit-based (strict engine isolation)</p>
            <p><strong>{t('deepdive.leakage')}</strong> Passed (No future data contamination in windowing)</p>
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
          <span className="section-label">{t('deepdive.discarded')}</span>
          <div className="dd-content">
            <ul className="discard-list">
              <li>
                <strong>{t('deepdive.cmapss_discard_1_title')}</strong> 
                <span className="text-muted"> {t('deepdive.cmapss_discard_1_desc')}</span>
              </li>
              <li>
                <strong>{t('deepdive.cmapss_discard_2_title')}</strong>
                <span className="text-muted"> {t('deepdive.cmapss_discard_2_desc')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Honest Performance Panel */}
      <div className="panel performance-panel">
        <span className="section-label text-accent">{t('deepdive.honest_perf_cmapss')}</span>
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
              {t('deepdive.cmapss_perf_text1')}
            </p>
            <p className="mt-1 text-accent" style={{fontWeight: 500}}>
              {t('deepdive.cmapss_perf_text2')}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DatasetDeepDivePage;
