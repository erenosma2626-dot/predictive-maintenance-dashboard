import React from 'react';
import './LivePage.css';

// Sub-components to keep code clean
import LiveTelemetry from '../components/LiveTelemetry';
import RiskIndicator from '../components/RiskIndicator';
import FactorsPanel from '../components/FactorsPanel';
import LogPanel from '../components/LogPanel';
import EngineModel from '../components/EngineModel';
import { useLanguage } from '../contexts/LanguageContext';

const LivePage = ({ dataset, currentData, history, logs, isAlert }) => {
  const { t } = useLanguage();

  if (!currentData) return <div className="loading">{t('live.initializing', 'Initializing Telemetry...')}</div>;

  return (
    <div className="live-page">
      <div className="top-row">
        <LiveTelemetry data={currentData} history={history} dataset={dataset} />
        <RiskIndicator data={currentData} dataset={dataset} />
      </div>
      
      <div className="middle-row">
        <div className="engine-wrapper">
          <EngineModel isAlert={isAlert} maintenanceProbability={currentData.maintenance_probability} dataset={dataset} />
        </div>
        <FactorsPanel data={currentData} isAlert={isAlert} dataset={dataset} />
      </div>

      <div className="bottom-row">
        <LogPanel logs={logs} />
      </div>
    </div>
  );
};

export default LivePage;
