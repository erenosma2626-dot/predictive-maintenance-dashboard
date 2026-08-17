import React, { useEffect, useState } from 'react'
import { useFleetSimulation } from '../../contexts/FleetSimulationContext'
import { useLanguage } from '../../contexts/LanguageContext'

export function Box5CrewRoster() {
  const { crews, events } = useFleetSimulation()
  const { t } = useLanguage()
  
  const [localEtas, setLocalEtas] = useState({})

  // Update local ETAs based on crews and events
  useEffect(() => {
    setLocalEtas(prev => {
      const newEtas = { ...prev }
      
      // Decrease all existing ETAs that are > 0
      Object.keys(newEtas).forEach(id => {
        if (newEtas[id] > 0) {
          newEtas[id] -= 1
        }
      })
      
      // Re-sync with the real data if needed
      crews.forEach(c => {
        if (c.status === 'dispatched' && c.eta_sim_hours !== null) {
          // If we don't have a local ETA for this crew, or if it changed, sync it
          if (newEtas[c.id] === undefined || newEtas[c.id] === 0) {
            newEtas[c.id] = c.eta_sim_hours
          }
        } else {
          // If crew is available, remove from local ETAs
          delete newEtas[c.id]
        }
      })
      return newEtas
    })
  }, [events, crews])

  return (
    <>
      <div className="panel-title">{t('fleet.crew_roster')}</div>
      <div className="scrollable-content">
        {crews.length === 0 ? (
          <div style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.7, fontSize: '13px', fontFamily: 'monospace' }}>
            <div className="spinner" style={{ width: '12px', height: '12px', border: '2px solid #88aa00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            {t('fleet.loading_crews')}
          </div>
        ) : (
          crews.map(crew => {
          const isAvailable = crew.status === 'available'
          const currentEta = localEtas[crew.id] !== undefined ? localEtas[crew.id] : crew.eta_sim_hours
          
          return (
            <div key={crew.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', fontSize: '13px', fontFamily: 'monospace' }}>
              <span style={{ color: isAvailable ? '#88aa00' : '#ffaa00' }}>{crew.id}</span>
              <span style={{ opacity: 0.7 }}>
                {isAvailable 
                  ? t('fleet.available') 
                  : `→ ${crew.assigned_machine_id} (${t('fleet.repairing')}, ${currentEta} ${t('fleet.ticks_left')})`}
              </span>
            </div>
          )
        })
        )}
      </div>
    </>
  )
}
