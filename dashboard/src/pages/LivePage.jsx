import React, { useState, useEffect, useRef } from 'react';
import { LiveService } from '../services/LiveService';
import './LivePage.css';

// Sub-components to keep code clean
import LiveTelemetry from '../components/LiveTelemetry';
import RiskIndicator from '../components/RiskIndicator';
import FactorsPanel from '../components/FactorsPanel';
import LogPanel from '../components/LogPanel';

const LivePage = () => {
  const [currentData, setCurrentData] = useState(null);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isAlert, setIsAlert] = useState(false);

  useEffect(() => {
    // Handler for incoming data
    const handleNewData = (newData) => {
      if (!newData || !newData.sensors) return;
      
      setCurrentData(newData);
      
      setHistory(prev => {
        const newHistory = [...prev, newData];
        if (newHistory.length > 100) return newHistory.slice(newHistory.length - 100);
        return newHistory;
      });

      if (newData.maintenance_probability >= 0.3) {
        setIsAlert(true);
      } else {
        setIsAlert(false);
      }

      if (newData.cycle % 5 === 0 || newData.maintenance_probability >= 0.3) {
        let msg = `> TICK: Cycle ${newData.cycle} - Prob: ${newData.maintenance_probability.toFixed(3)}`;
        if (newData.maintenance_probability >= 0.3) {
          msg = `> WARN: maintenance_flag raised (Prob: ${newData.maintenance_probability.toFixed(3)}) at cycle ${newData.cycle}`;
        }
        setLogs(prev => [...prev, msg].slice(-50));
      }
    };

    const service = new LiveService(handleNewData);

    // Initial fetch of current state
    service.fetchCurrentState().then(initData => {
      if (initData) handleNewData(initData);
    });

    // Start WebSocket connection
    service.connect();

    return () => {
      service.disconnect();
    };
  }, []);

  if (!currentData) return <div className="loading">Initializing Telemetry...</div>;

  return (
    <div className="live-page">
      <div className="top-row">
        <LiveTelemetry data={currentData} history={history} />
        <RiskIndicator data={currentData} />
      </div>
      
      <div className="middle-row">
        <FactorsPanel data={currentData} isAlert={isAlert} />
      </div>

      <div className="bottom-row">
        <LogPanel logs={logs} />
      </div>
    </div>
  );
};

export default LivePage;
