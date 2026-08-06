import React, { useState, useEffect, useRef } from 'react';
import './LogPanel.css';

const LogPanel = ({ logs }) => {
  const [expanded, setExpanded] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (expanded && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, expanded]);

  return (
    <div className={`panel log-panel ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="log-header" onClick={() => setExpanded(!expanded)}>
        <span className="section-label" style={{marginBottom: 0}}>
          {expanded ? '- TERMINAL // STD_OUT' : '+ LOGS // TERMINAL'}
        </span>
      </div>
      
      {expanded && (
        <div className="log-content">
          {logs.map((log, i) => (
            <div key={i} className="log-line">
              {log}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}
    </div>
  );
};

export default LogPanel;
