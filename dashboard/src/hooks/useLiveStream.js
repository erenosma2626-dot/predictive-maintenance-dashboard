import { useState, useEffect } from 'react';
import { LiveService } from '../services/LiveService';

export const useLiveStream = (dataset, enabled = true) => {
  const [currentData, setCurrentData] = useState(null);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isAlert, setIsAlert] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Handler for incoming data
    const handleNewData = (newData) => {
      if (!newData || !newData.sensors) return;
      
      const prob = newData.risk_probability !== undefined ? newData.risk_probability : newData.maintenance_probability;
      const cycle = newData.tick !== undefined ? newData.tick : newData.cycle;

      // Normalize data to work with existing UI components where possible
      const normalizedData = {
        ...newData,
        maintenance_probability: prob,
        cycle: cycle,
        engine_total_lifespan: newData.engine_total_lifespan || 100
      };
      
      setCurrentData(normalizedData);
      
      setHistory(prev => {
        const newHistory = [...prev, normalizedData];
        if (newHistory.length > 100) return newHistory.slice(newHistory.length - 100);
        return newHistory;
      });

      if (prob >= (dataset === 'bearing' ? 0.75 : 0.3)) {
        setIsAlert(true);
      } else {
        setIsAlert(false);
      }

      if (cycle % 5 === 0 || prob >= (dataset === 'bearing' ? 0.75 : 0.3)) {
        let msg = `> TICK: Cycle/Tick ${cycle} - Prob: ${prob.toFixed(3)}`;
        if (prob >= (dataset === 'bearing' ? 0.75 : 0.3)) {
          msg = `> WARN: risk flag raised (Prob: ${prob.toFixed(3)}) at tick ${cycle}`;
        }
        setLogs(prev => [...prev, msg].slice(-50));
      }
    };

    // Reset state on dataset change
    setCurrentData(null);
    setHistory([]);
    setLogs([]);
    setIsAlert(false);

    if (dataset === 'bearing') {
      let globalTick = 0;
      let mockInterval = setInterval(() => {
        const currentBearing = Math.floor(globalTick / 100) + 1;
        const tick = globalTick % 100;
        
        if (tick === 0) {
          setHistory([]);
          setLogs(prev => [...prev, `> INFO: Starting new stream for SYN-${currentBearing}`].slice(-50));
        }

        const life_pct = tick / 100; // 0.00 to 0.99
        // Simulate risk probability rising sharply at the end
        const risk_prob = life_pct > 0.9 ? 0.7 + (life_pct - 0.9) * 3 : Math.random() * 0.1;
        
        handleNewData({
          life_pct: life_pct,
          tick: tick,
          engine_source_unit: currentBearing,
          engine_total_lifespan: 100, // mock max ticks per cycle
          sensors: {
            rms_rm_norm: 1.0 + life_pct * 2 + (Math.random() - 0.5) * 0.3,
            kurtosis_rm_norm: 1.0 + life_pct * 3 + (Math.random() - 0.5) * 0.5
          },
          risk_flag: risk_prob >= 0.75 ? 1 : 0,
          risk_probability: risk_prob,
          explanation: {
            top_features: [
              {feature: "rms_rm_norm", display_name: "Vibration Intensity", value: 1.5},
              {feature: "kurtosis_rm_norm", display_name: "Impact Sharpness", value: 1.2}
            ]
          }
        });
        
        globalTick++;
      }, 1000);

      return () => {
        clearInterval(mockInterval);
      };
    } else {
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
    }
  }, [dataset, enabled]);

  return { currentData, history, logs, isAlert };
};
