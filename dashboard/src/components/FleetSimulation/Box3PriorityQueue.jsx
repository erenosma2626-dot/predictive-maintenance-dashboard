import React, { useMemo } from 'react'
import { useFleetSimulation } from '../../contexts/FleetSimulationContext'
import { useLanguage } from '../../contexts/LanguageContext'

export function Box3PriorityQueue() {
  const { machines, crews, selectedMachineId, setSelectedMachineId } = useFleetSimulation()
  const { t } = useLanguage()

  const priorityQueue = useMemo(() => {
    // Filter at_risk machines
    const atRisk = machines.filter(m => m.status === 'at_risk')
    
    // Sort by risk_probability descending
    atRisk.sort((a, b) => b.risk_probability - a.risk_probability)
    
    // Take top 5
    return atRisk.slice(0, 5).map(m => {
      // Find if a crew is dispatched to this machine
      const assignedCrew = crews.find(c => c.assigned_machine_id === m.id)
      
      let statusText = 'Queued (no crew available)'
      if (assignedCrew) {
        statusText = `Crew dispatched (ETA: ${assignedCrew.eta_sim_hours} ticks)`
      }

      return {
        ...m,
        queueStatus: statusText
      }
    })
  }, [machines, crews])

  return (
    <>
      <div className="panel-title">{t('fleet.priority_queue')}</div>
      <div className="scrollable-content">
        {priorityQueue.length === 0 ? (
          <div style={{ opacity: 0.5, padding: '10px' }}>No machines currently at risk.</div>
        ) : (
          priorityQueue.map((item, index) => (
            <div 
              key={item.id}
              className={`list-row ${selectedMachineId === item.id ? 'selected' : ''}`}
              onClick={() => setSelectedMachineId(item.id)}
              style={{ flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#ffaa00', marginRight: '8px' }}>{index + 1}.</span>
                <span>{item.id} — {item.fault_type.replace('_', ' ')}</span>
              </div>
              <div style={{ opacity: 0.6, fontSize: '11px', paddingLeft: '20px' }}>
                {item.queueStatus}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
