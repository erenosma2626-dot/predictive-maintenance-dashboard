import React, { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { useFleetSimulation } from '../../contexts/FleetSimulationContext'
import { BearingModel } from '../BearingModel'
import { EngineObject } from '../EngineModel'
import { SimulationClock } from './SimulationClock'
import { useLanguage } from '../../contexts/LanguageContext'

export function Box2Diagnosis({ dataset = 'bearing' }) {
  const { machines, selectedMachineId, events, agentStatus } = useFleetSimulation()
  const { t } = useLanguage()

  const selectedMachine = useMemo(() =>
    machines.find(m => m.id === selectedMachineId),
    [machines, selectedMachineId]) || machines[0]

  const relevantEvent = useMemo(() => {
    if (!selectedMachine) return null
    return events.find(e => e.machine_id === selectedMachine.id && 
      (e.event_type === 'diagnosis_complete' || e.event_type === 'escalation_diagnosis_complete'))
  }, [events, selectedMachine])

  const diagAgent = agentStatus.find(a => a.agent_name === 'diagnosis')
  const isAgentWorking = diagAgent?.current_state === 'working' && diagAgent?.current_machine_id === selectedMachine?.id

  return (
    <>
      <div className="panel-title" style={{ display: 'flex', alignItems: 'center' }}>
        <span>{t('fleet.diagnosis')}</span>
        <div style={{ marginLeft: 'auto', background: 'rgba(0,0,0,0.3)', padding: '5px 15px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <SimulationClock />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: 1, minHeight: '300px', background: 'radial-gradient(circle at center, #1a1a24 0%, #0d0d12 100%)', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>

          <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {selectedMachine?.id || '---'}
            </div>
          </div>

          <Canvas camera={{ position: dataset === 'cmapss' ? [0, 2, 6] : [0, 1.5, 4], fov: 45 }}>
            <ambientLight intensity={1.5} />
            <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
            <directionalLight position={[-10, 5, -5]} intensity={1} color="#ffaa00" />
            <pointLight position={[0, -2, 0]} intensity={1.5} color="#4444ff" />

            {dataset === 'cmapss' ? (
              <EngineObject
                maintenanceProbability={selectedMachine?.life_pct ? (100 - selectedMachine.life_pct) / 100 : 1}
                isAlert={selectedMachine?.status === 'at_risk'}
                dataset="cmapss"
              />
            ) : (
              <BearingModel
                highlightedRegion={selectedMachine?.status === 'at_risk' ? selectedMachine.fault_type : null}
              />
            )}

            <OrbitControls
              enablePan={false}
              autoRotate={true}
              autoRotateSpeed={2.0}
              maxPolarAngle={Math.PI / 2 + 0.2}
              minPolarAngle={Math.PI / 2 - 0.2}
            />
            <Environment preset="city" />
          </Canvas>
        </div>

        {/* Diagnosis Text Area */}
        <div style={{ marginTop: '10px', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', minHeight: '80px', display: 'flex', alignItems: 'center' }}>
          {isAgentWorking ? (
            <div style={{ color: '#ffaa00', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="spinner" style={{ width: '12px', height: '12px', border: '2px solid #ffaa00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              Diagnosis Agent is analyzing...
            </div>
          ) : relevantEvent ? (
            <div style={{ color: relevantEvent.event_type === 'escalation_diagnosis_complete' ? '#ffaa00' : '#ddd', fontSize: '14px', lineHeight: '1.4' }}>
              <span style={{ color: '#88aa00', fontWeight: 'bold', marginRight: '5px' }}>Agent:</span>
              {relevantEvent.event_type === 'escalation_diagnosis_complete' && (
                <span style={{ color: '#ff4444', fontWeight: 'bold', marginRight: '5px' }}>[ESCALATED]</span>
              )}
              {relevantEvent.message}
            </div>
          ) : (
            <div style={{ color: '#666', fontStyle: 'italic' }}>
              Waiting for agent diagnosis...
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}} />
    </>
  )
}
