import React from 'react';
import './LiveTelemetry.css';

const LiveTelemetry = ({ data, history }) => {
  // SVG drawing logic for the oscilloscope feel
  const width = 600;
  const height = 200;
  
  // Extract values for drawing. We use 's_20' as the primary sensor for display
  const sensorKey = 's_20';
  const values = history.map(d => d.sensors[sensorKey]);
  
  const min = Math.min(...values, 38);
  const max = Math.max(...values, 40);
  const range = max - min || 1;

  const pathD = values.map((val, i) => {
    const x = (i / 100) * width; // Assuming max 100 points
    const y = height - ((val - min) / range) * height;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="panel telemetry-panel">
      <span className="section-label">LIVE TELEMETRY STREAM</span>
      
      <div className="telemetry-meta">
        <span>SRC: SYN-{data.engine_source_unit}</span>
        <span>RATE: 1Hz</span>
        <span>CYC: {data.cycle}/{data.engine_total_lifespan}</span>
        <span>SENS: {sensorKey}</span>
      </div>

      <div className="telemetry-chart-container">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="telemetry-svg">
          <path d={pathD} className="telemetry-line" />
        </svg>
      </div>
    </div>
  );
};

export default LiveTelemetry;
