import React, { useState } from 'react'
import { useFleetSimulation } from '../../contexts/FleetSimulationContext'
import { useLanguage } from '../../contexts/LanguageContext'

export function Box1FleetOverview() {
  const { machines, selectedMachineId, setSelectedMachineId } = useFleetSimulation()
  const { t } = useLanguage()
  const [viewMode, setViewMode] = useState('map') // default map

  return (
    <>
      <div className="panel-title">
        <span>{t('fleet.overview')}</span>
        <div className="toggle-group" style={{ cursor: 'pointer', fontSize: '12px' }}>
          <span 
            style={{ opacity: viewMode === 'list' ? 1 : 0.5, marginRight: '10px' }}
            onClick={() => setViewMode('list')}
          >
            [LIST]
          </span>
          <span 
            style={{ opacity: viewMode === 'map' ? 1 : 0.5 }}
            onClick={() => setViewMode('map')}
          >
            [MAP]
          </span>
        </div>
      </div>
      
      <div className="scrollable-content" style={{ display: 'flex', flexDirection: 'column' }}>
        {viewMode === 'list' ? (
          <div className="list-view">
            {machines.map(m => (
              <div 
                key={m.id} 
                className={`list-row ${selectedMachineId === m.id ? 'selected' : ''}`}
                onClick={() => setSelectedMachineId(m.id)}
              >
                <span>
                  <span className={`status-dot ${m.status}`}></span>
                  {m.id}
                </span>
                <span style={{ opacity: 0.7 }}>
                  {m.status === 'at_risk' ? `${t('fleet.at_risk')} (${m.fault_type.replace('_', ' ')})` : t('fleet.healthy')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="map-view" style={{ 
            flex: 1,
            position: 'relative',
            backgroundColor: '#0a0a0c', /* Solid dark background */
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gridTemplateRows: 'repeat(3, 1fr)',
              height: '100%',
              width: '100%',
              padding: '20px',
              gap: '15px'
            }}>
              {machines.map(m => (
                <div 
                  key={m.id}
                  onClick={() => setSelectedMachineId(m.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: `1px solid ${selectedMachineId === m.id ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: selectedMachineId === m.id ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div className={`status-dot ${m.status}`} style={{ margin: '0 auto 8px' }}></div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', color: '#ccc' }}>{m.id}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
