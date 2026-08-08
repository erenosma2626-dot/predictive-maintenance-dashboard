import React from 'react';
import bearingTemplates from '../data/bearing_templates.json';
import './SyntheticDataPage.css';
import { useLanguage } from '../contexts/LanguageContext';

const ChartPanel = ({ featureKey, title, maxVal, history }) => {
  const { t } = useLanguage();
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
        <span>{t('synthetic.life_0')}</span>
        <span>{t('synthetic.life_50')}</span>
        <span>{t('synthetic.life_100')}</span>
      </div>
    </div>
  );
};

const SyntheticDataPage = ({ dataset, currentData, history }) => {
  const { t } = useLanguage();
  if (dataset !== 'bearing') return null;

  return (
    <div className="synth-page fade-in">
      
      {/* Section 1 - How it's built */}
      <div className="panel synth-section">
        <span className="section-label">{t('synthetic.generation_method')}</span>
        <div className="synth-content">
          <p className="synth-desc">
            {t('synthetic.synth_desc')}
          </p>
        </div>
      </div>

      {/* Section 2 - Why it's a reasonable stand-in */}
      <div className="panel synth-section">
        <span className="section-label">{t('synthetic.why_trust')}</span>
        <div className="synth-content">
          <ul className="checklist">
            <li>{t('synthetic.trust_1')}</li>
            <li>{t('synthetic.trust_2')}</li>
            <li>{t('synthetic.trust_3')}</li>
          </ul>
        </div>
      </div>

      {/* Section 3 - Live comparison (Centerpiece) */}
      <div className="panel synth-section comparison-panel">
        <span className="section-label text-accent">{t('synthetic.live_comparison')}</span>
        <div className="synth-content charts-container">
          <ChartPanel 
            featureKey="rms_rm_norm" 
            title={t('synthetic.vib_intensity')} 
            maxVal={4} 
            history={history} 
          />
          <ChartPanel 
            featureKey="kurtosis_rm_norm" 
            title={t('synthetic.impact_sharpness')} 
            maxVal={6} 
            history={history} 
          />
        </div>
      </div>

      {/* Section 4 - What this is / isn't */}
      <div className="panel synth-section synth-footer">
        <div className="synth-content">
          <p>
            <strong>{t('synthetic.what_for')}</strong>{t('synthetic.what_for_desc')}
          </p>
          <p className="mt-1">
            <strong>{t('synthetic.what_not')}</strong>{t('synthetic.what_not_desc')}
          </p>
        </div>
      </div>

    </div>
  );
};

export default SyntheticDataPage;
