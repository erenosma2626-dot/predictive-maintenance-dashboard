import React from 'react'
import { useFleetSimulation } from '../../contexts/FleetSimulationContext'
import { useLanguage } from '../../contexts/LanguageContext'

export function AgentsStatusOverlay() {
  const { agentStatus } = useFleetSimulation()
  const { t } = useLanguage()

  // Default ordering for agents
  const AGENT_ORDER = ['monitoring', 'diagnosis', 'planning', 'reporting']

  const sortedAgents = [...agentStatus].sort((a, b) => {
    return AGENT_ORDER.indexOf(a.agent_name) - AGENT_ORDER.indexOf(b.agent_name)
  })

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '15px',
      zIndex: 1000,
      background: 'rgba(15, 15, 18, 0.9)',
      padding: '10px 20px',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
      fontFamily: 'monospace',
      fontSize: '11px',
      textTransform: 'uppercase'
    }}>
      <div style={{ color: '#aaa', display: 'flex', alignItems: 'center', marginRight: '10px' }}>
        {t('fleet.agents')}
      </div>
      {sortedAgents.map(agent => {
        const isWorking = agent.current_state === 'working'
        return (
          <div key={agent.agent_name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isWorking ? '#ffaa00' : '#444',
              boxShadow: isWorking ? '0 0 8px #ffaa00' : 'none',
              transition: 'all 0.3s ease'
            }} />
            <span style={{ color: isWorking ? '#fff' : '#666' }}>
              {agent.agent_name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
