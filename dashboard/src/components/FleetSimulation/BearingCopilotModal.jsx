import React, { useState, useEffect, useMemo } from 'react'
import { useFleetSimulation } from '../../contexts/FleetSimulationContext'
import { useBearingChat } from '../../contexts/BearingChatContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { API_ENDPOINTS } from '../../config/api'

import { Scene1AssetCard } from './copilot/Scene1AssetCard'
import { Scene2ChatAssistant } from './copilot/Scene2ChatAssistant'
import { Scene3ProtocolCrew } from './copilot/Scene3ProtocolCrew'
import { Scene4SopExam } from './copilot/Scene4SopExam'
import { Scene5ActiveRepairs } from './copilot/Scene5ActiveRepairs'
import './copilot/BearingCopilotModal.css'

export function BearingCopilotModal({ isOpen, onClose }) {
  const { machines, crews, selectedMachineId, setSelectedMachineId } = useFleetSimulation()
  const {
    chatMessages,
    isChatLoading,
    sendChatMessage,
    activeRepairRecords,
    recordRepairJob
  } = useBearingChat()
  const { t, language } = useLanguage()

  const [activeScene, setActiveScene] = useState(1)

  // Scene 3 state
  const atRiskMachines = useMemo(() => machines.filter(m => m.status === 'at_risk'), [machines])
  const [pickedMachineId, setPickedMachineId] = useState(null)
  const [pickedCrewId, setPickedCrewId] = useState(null)

  // Target machine
  const targetMachine = useMemo(() => {
    return machines.find(m => m.id === (pickedMachineId || selectedMachineId)) || atRiskMachines[0] || machines[0]
  }, [machines, pickedMachineId, selectedMachineId, atRiskMachines])

  // Sync picked machine with target
  useEffect(() => {
    if (targetMachine && !pickedMachineId) {
      setPickedMachineId(targetMachine.id)
    }
  }, [targetMachine, pickedMachineId])

  // Scene 2 Chatbot local input
  const [chatInput, setChatInput] = useState('')

  // Scene 4 Exam state
  const [solutionInput, setSolutionInput] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [evalResult, setEvalResult] = useState(null)

  // Scene 5 Accordion expanded state
  const [expandedRepairId, setExpandedRepairId] = useState(null)

  // Auto-pause simulation when modal opens, resume when closes
  useEffect(() => {
    if (isOpen) {
      fetch(API_ENDPOINTS.SIMULATION_PAUSE('bearing') + '?paused=true', { method: 'POST' }).catch(() => {})
    } else {
      fetch(API_ENDPOINTS.SIMULATION_PAUSE('bearing') + '?paused=false', { method: 'POST' }).catch(() => {})
    }
    return () => {
      fetch(API_ENDPOINTS.SIMULATION_PAUSE('bearing') + '?paused=false', { method: 'POST' }).catch(() => {})
    }
  }, [isOpen])

  // Reset states when opening
  useEffect(() => {
    if (isOpen && atRiskMachines.length > 0) {
      const firstRisk = atRiskMachines[0]
      setPickedMachineId(firstRisk.id)
      setSelectedMachineId(firstRisk.id)
    }
  }, [isOpen, atRiskMachines, setSelectedMachineId])

  const handleSendChat = (queryText) => {
    const textToSend = queryText || chatInput
    if (!textToSend || !textToSend.trim()) return
    sendChatMessage(
      textToSend,
      targetMachine?.id,
      targetMachine?.status === 'at_risk' ? targetMachine?.fault_type : undefined
    )
    if (!queryText) setChatInput('')
  }

  const handleVerifySolution = async () => {
    if (!solutionInput.trim()) return
    setIsVerifying(true)
    setEvalResult(null)

    try {
      const res = await fetch(API_ENDPOINTS.BEARING_VERIFY_SOLUTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_solution: solutionInput,
          machine_id: pickedMachineId || targetMachine?.id,
          fault_type: targetMachine?.status === 'at_risk' ? targetMachine?.fault_type : undefined
        })
      })
      if (res.ok) {
        const data = await res.json()
        setEvalResult(data)
        if (data.is_correct) {
          // Record repair job metadata
          const chosenCrew = pickedCrewId || crews.find(c => c.status === 'available')?.id || 'Crew-BEA-1'
          const targetId = pickedMachineId || targetMachine?.id
          const problemName = targetMachine?.fault_type ? targetMachine.fault_type.replace('_', ' ').toUpperCase() : 'Rulman Aşınması'
          recordRepairJob(targetId, chosenCrew, problemName, solutionInput)

          setTimeout(() => {
            handleDispatchCrew(targetId, chosenCrew)
          }, 1200)
        }
      }
    } catch (err) {
      console.error('Evaluation failed:', err)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDispatchCrew = async (machineId, crewId) => {
    const targetId = machineId || pickedMachineId || targetMachine?.id
    const chosenCrew = crewId || pickedCrewId || crews.find(c => c.status === 'available')?.id || 'Crew-BEA-1'

    try {
      await fetch(API_ENDPOINTS.BEARING_MANUAL_DISPATCH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_id: targetId,
          crew_id: chosenCrew,
          dataset_type: 'bearing'
        })
      })
    } catch (err) {
      console.error('Dispatch failed:', err)
    }

    setExpandedRepairId(targetId)
    setActiveScene(5)
  }

  if (!isOpen) return null

  const isCurrentTargetAtRisk = targetMachine?.status === 'at_risk'
  const activeDispatchedCrews = crews.filter(c => c.status === 'dispatched' && c.assigned_machine_id)

  const quickQuestions = language === 'tr' ? [
    `Bu arıza (${isCurrentTargetAtRisk ? targetMachine?.fault_type : 'genel'}) için yapılması gereken SOP nedir?`,
    `${targetMachine?.id} için hangi gres tipi ve kaç gram basılmalı?`,
    `Rulman montaj sıcaklığı kaç derece olmalıdır?`,
    `Bu makinede geçmişte benzer bir arıza yaşandı mı?`
  ] : [
    `What is the SOP procedure for this fault (${isCurrentTargetAtRisk ? targetMachine?.fault_type : 'general'})?`,
    `What grease type & amount is required for ${targetMachine?.id}?`,
    `What is the target induction mounting temperature?`,
    `Was there a similar historical failure on this machine?`
  ]

  const sceneNavItems = [
    { id: 1, title: t('copilot.scene1_tab') },
    { id: 2, title: t('copilot.scene2_tab') },
    { id: 3, title: t('copilot.scene3_tab') },
    { id: 4, title: t('copilot.scene4_tab') },
    { id: 5, title: t('copilot.scene5_tab') }
  ]

  return (
    <div className="copilot-modal-backdrop">
      <div className="copilot-modal-container">
        {/* Modal Header */}
        <div className="copilot-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                {t('copilot.modal_title')}
              </div>
              <div style={{ fontSize: '12px', color: '#8899aa', marginTop: '2px' }}>
                {t('copilot.modal_subtitle')}
              </div>
            </div>
            <div className="copilot-modal-header-badge">
              {t('copilot.sim_paused')}
            </div>
          </div>

          <button onClick={onClose} className="copilot-modal-close-btn">
            ✕
          </button>
        </div>

        {/* Scene Navigation Bar */}
        <div className="copilot-nav-bar">
          {sceneNavItems.map(s => {
            const isActive = activeScene === s.id
            return (
              <button
                key={s.id}
                onClick={() => setActiveScene(s.id)}
                className={`copilot-nav-tab ${isActive ? 'active' : ''}`}
              >
                {s.title}
              </button>
            )
          })}
        </div>

        {/* Scene Content Area */}
        <div className="copilot-scene-body">
          {activeScene === 1 && (
            <Scene1AssetCard
              targetMachine={targetMachine}
              isCurrentTargetAtRisk={isCurrentTargetAtRisk}
              t={t}
            />
          )}

          {activeScene === 2 && (
            <Scene2ChatAssistant
              chatMessages={chatMessages}
              isChatLoading={isChatLoading}
              chatInput={chatInput}
              setChatInput={setChatInput}
              handleSendChat={handleSendChat}
              quickQuestions={quickQuestions}
              onProceedToCrew={() => setActiveScene(3)}
              t={t}
            />
          )}

          {activeScene === 3 && (
            <Scene3ProtocolCrew
              machines={machines}
              atRiskMachines={atRiskMachines}
              crews={crews}
              pickedMachineId={pickedMachineId}
              setPickedMachineId={setPickedMachineId}
              setSelectedMachineId={setSelectedMachineId}
              pickedCrewId={pickedCrewId}
              setPickedCrewId={setPickedCrewId}
              onBackToChat={() => setActiveScene(2)}
              onProceedToVerify={() => setActiveScene(4)}
              t={t}
            />
          )}

          {activeScene === 4 && (
            <Scene4SopExam
              pickedMachineId={pickedMachineId}
              targetMachine={targetMachine}
              isCurrentTargetAtRisk={isCurrentTargetAtRisk}
              solutionInput={solutionInput}
              setSolutionInput={setSolutionInput}
              handleVerifySolution={handleVerifySolution}
              isVerifying={isVerifying}
              evalResult={evalResult}
              onRetryChat={() => setActiveScene(2)}
              t={t}
            />
          )}

          {activeScene === 5 && (
            <Scene5ActiveRepairs
              activeDispatchedCrews={activeDispatchedCrews}
              activeRepairRecords={activeRepairRecords}
              expandedRepairId={expandedRepairId}
              setExpandedRepairId={setExpandedRepairId}
              language={language}
              onClose={onClose}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  )
}
