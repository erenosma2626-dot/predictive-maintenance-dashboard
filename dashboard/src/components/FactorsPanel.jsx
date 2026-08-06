import React from 'react';
import './FactorsPanel.css';

const SENSOR_NAMES = {
  "s_1": "Total Temp Fan Inlet",
  "s_2": "Total Temp LPC Outlet",
  "s_3": "Total Temp HPC Outlet",
  "s_4": "Total Temp LPT Outlet",
  "s_5": "Pressure Fan Inlet",
  "s_6": "Total Pressure Bypass",
  "s_7": "Total Pressure HPC Outlet",
  "s_8": "Physical Fan Speed",
  "s_9": "Physical Core Speed",
  "s_10": "Engine Pressure Ratio",
  "s_11": "Static Pressure HPC Outlet",
  "s_12": "Ratio Fuel Flow to Ps30",
  "s_13": "Corrected Fan Speed",
  "s_14": "Corrected Core Speed",
  "s_15": "Bypass Ratio",
  "s_16": "Burner Fuel-Air Ratio",
  "s_17": "Bleed Enthalpy",
  "s_18": "Demanded Fan Speed",
  "s_19": "Demanded Corrected Fan Speed",
  "s_20": "HPT Coolant Bleed",
  "s_21": "LPT Coolant Bleed"
};

const formatFeatureName = (featureCode) => {
  if (!featureCode) return '';
  let baseCode = featureCode;
  let suffix = '';
  
  if (featureCode.endsWith('_trend')) {
    baseCode = featureCode.replace('_trend', '');
    suffix = ' (Trend)';
  } else if (featureCode.endsWith('_rm')) {
    baseCode = featureCode.replace('_rm', '');
    suffix = ' (Rolling Mean)';
  } else if (featureCode.endsWith('_dev')) {
    baseCode = featureCode.replace('_dev', '');
    suffix = ' (Deviation)';
  }
  
  const realName = SENSOR_NAMES[baseCode] || baseCode;
  return `${realName}${suffix}`;
};

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
          <div className="factor-content" style={{fontSize: '0.85rem'}}>
            {formatFeatureName(top_features[0]?.feature)} 
            <span className="factor-dir">{top_features[0]?.shap_value > 0 ? '↑' : '↓'}</span>
          </div>
        </div>
        <div className="factor-cell">
          <span className="section-label">2nd FACTOR</span>
          <div className="factor-content" style={{fontSize: '0.85rem'}}>
            {formatFeatureName(top_features[1]?.feature)}
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
