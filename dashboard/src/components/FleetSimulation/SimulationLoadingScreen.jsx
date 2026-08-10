import React, { useState, useEffect } from 'react'
import { useFleetSimulation } from '../../contexts/FleetSimulationContext'

const features = [
  { id: 'db', label: 'Connecting to Fleet Database' },
  { id: 'agents', label: 'Initializing AI Agents' },
  { id: 'sim', label: 'Booting Simulation Engine' },
  { id: '3d', label: 'Loading 3D Models' },
]

export function SimulationLoadingScreen({ onComplete }) {
  const { machines, agentStatus, crews } = useFleetSimulation()
  const [status, setStatus] = useState({
    db: 'loading',
    agents: 'loading',
    sim: 'loading',
    '3d': 'loading'
  })

  useEffect(() => {
    const isDbReady = machines && machines.length > 0 && crews && crews.length > 0
    const areAgentsReady = agentStatus && Object.keys(agentStatus).length > 0
    const isSimReady = isDbReady && areAgentsReady // Sim is ready if it's producing state
    
    setStatus(prev => ({
      ...prev,
      db: isDbReady ? 'ready' : 'loading',
      agents: areAgentsReady ? 'ready' : 'loading',
      sim: isSimReady ? 'ready' : 'loading',
    }))
  }, [machines, agentStatus, crews])

  useEffect(() => {
    // 3D models load concurrently, simulate short delay for the asset load
    const timeout = setTimeout(() => {
      setStatus(prev => ({ ...prev, '3d': 'ready' }))
    }, 1200)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    // Check when all are ready
    if (Object.values(status).every(s => s === 'ready')) {
      const finishTimeout = setTimeout(onComplete, 500) // Brief pause after all green before hiding
      return () => clearTimeout(finishTimeout)
    }
  }, [status, onComplete])

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: '#0d0d12',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#fff',
      fontFamily: 'monospace'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        minWidth: '350px'
      }}>
        <h2 style={{ margin: '0 0 30px 0', color: '#ffaa00', textAlign: 'center', letterSpacing: '2px' }}>
          SYSTEM STARTUP
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {features.map(f => {
            const isReady = status[f.id] === 'ready'
            return (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {isReady ? (
                  <div style={{ color: '#00aa55', fontSize: '18px' }}>✓</div>
                ) : (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 170, 0, 0.3)',
                    borderTop: '2px solid #ffaa00',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                <span style={{ 
                  color: isReady ? '#fff' : '#aaa',
                  transition: 'color 0.3s ease'
                }}>
                  {f.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
