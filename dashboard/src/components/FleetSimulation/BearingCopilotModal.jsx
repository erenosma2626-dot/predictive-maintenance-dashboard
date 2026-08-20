import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useFleetSimulation } from '../../contexts/FleetSimulationContext'
import { useBearingChat } from '../../contexts/BearingChatContext'
import { useLanguage } from '../../contexts/LanguageContext'

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
  const chatEndRef = useRef(null)

  // Scene 4 Exam state
  const [solutionInput, setSolutionInput] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [evalResult, setEvalResult] = useState(null)

  // Scene 5 Accordion expanded state
  const [expandedRepairId, setExpandedRepairId] = useState(null)

  // Auto-scroll chat
  useEffect(() => {
    if (activeScene === 2) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, isChatLoading, activeScene])

  // API Call helper
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'

  // Auto-pause simulation when modal opens, resume when closes
  useEffect(() => {
    if (isOpen) {
      fetch(`${apiBase}/api/simulation/pause/bearing?paused=true`, { method: 'POST' }).catch(() => {})
    } else {
      fetch(`${apiBase}/api/simulation/pause/bearing?paused=false`, { method: 'POST' }).catch(() => {})
    }
    return () => {
      fetch(`${apiBase}/api/simulation/pause/bearing?paused=false`, { method: 'POST' }).catch(() => {})
    }
  }, [isOpen, apiBase])

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
      const res = await fetch(`${apiBase}/api/bearing/verify-solution`, {
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
      await fetch(`${apiBase}/api/bearing/manual-dispatch`, {
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

  // Combine live dispatched crews with activeRepairRecords
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

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 7, 15, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1050px',
        height: '88vh',
        background: '#0f111a',
        border: '1px solid rgba(255, 170, 0, 0.3)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(255, 170, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 24px',
          background: 'linear-gradient(90deg, #161926, #121420)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                {t('copilot.modal_title')}
              </div>
              <div style={{ fontSize: '12px', color: '#8899aa', marginTop: '2px' }}>
                {t('copilot.modal_subtitle')}
              </div>
            </div>
            <div style={{
              background: 'rgba(255, 170, 0, 0.15)',
              border: '1px solid rgba(255, 170, 0, 0.4)',
              color: '#ffaa00',
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '3px 8px',
              borderRadius: '4px',
              letterSpacing: '0.5px'
            }}>
              {t('copilot.sim_paused')}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Scene Navigation Bar */}
        <div style={{
          display: 'flex',
          background: '#131622',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '4px 16px',
          gap: '8px'
        }}>
          {[
            { id: 1, title: t('copilot.scene1_tab') },
            { id: 2, title: t('copilot.scene2_tab') },
            { id: 3, title: t('copilot.scene3_tab') },
            { id: 4, title: t('copilot.scene4_tab') },
            { id: 5, title: t('copilot.scene5_tab') }
          ].map(s => {
            const isActive = activeScene === s.id
            return (
              <button
                key={s.id}
                onClick={() => setActiveScene(s.id)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  background: isActive ? 'rgba(255, 170, 0, 0.15)' : 'transparent',
                  color: isActive ? '#ffaa00' : '#8899aa',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #ffaa00' : '2px solid transparent',
                  fontWeight: isActive ? 'bold' : 'normal',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderRadius: '4px 4px 0 0'
                }}
              >
                {s.title}
              </button>
            )
          })}
        </div>

        {/* Scene Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', position: 'relative' }}>
          {/* ================= SAHNE 1: ALARM & BİLGİ ================= */}
          {activeScene === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
              <div style={{
                background: isCurrentTargetAtRisk ? 'linear-gradient(135deg, rgba(255, 68, 68, 0.12), rgba(255, 170, 0, 0.08))' : 'rgba(68, 187, 119, 0.08)',
                border: isCurrentTargetAtRisk ? '1px solid rgba(255, 68, 68, 0.4)' : '1px solid rgba(68, 187, 119, 0.3)',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: isCurrentTargetAtRisk ? '#ff6666' : '#44bb77' }}>
                    {isCurrentTargetAtRisk
                      ? t('copilot.alert_risk').replace('{id}', targetMachine?.id || '')
                      : t('copilot.alert_healthy').replace('{id}', targetMachine?.id || '')}
                  </div>
                  <div style={{ fontSize: '14px', color: '#ccc', marginTop: '4px' }}>
                    {t('copilot.fault_status')} <strong style={{ color: '#ffaa00' }}>{isCurrentTargetAtRisk ? (targetMachine?.fault_type || 'inner_race').toUpperCase() : '-'}</strong> | {t('copilot.risk_prob')} <strong style={{ color: isCurrentTargetAtRisk ? '#ff4444' : '#44bb77' }}>%{((targetMachine?.risk_probability || 0.05) * 100).toFixed(1)}</strong>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                flex: 1
              }}>
                {/* Sol: Varlık Özeti */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '18px'
                }}>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>
                    {t('copilot.asset_params')} ({targetMachine?.id})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#aaa' }}>
                    <div>{t('copilot.machine_label')} <strong style={{ color: '#ddd' }}>{targetMachine?.id} - {t('copilot.unit_desc')}</strong></div>
                    <div>{t('copilot.status_label')} <span style={{ color: isCurrentTargetAtRisk ? '#ff4444' : '#44bb77', fontWeight: 'bold' }}>{isCurrentTargetAtRisk ? t('copilot.status_at_risk') : t('copilot.status_healthy')}</span></div>
                    <div>{t('copilot.life_wear')} <strong style={{ color: '#ffaa00' }}>%{targetMachine?.life_pct?.toFixed(1) || '0.0'}</strong></div>
                    <div>{t('copilot.highlighted_zone')} <strong style={{ color: '#00ddff' }}>{isCurrentTargetAtRisk ? (targetMachine?.fault_type || 'inner_race') : '-'}</strong></div>
                  </div>
                </div>

                {/* Sağ: Rehberlik Bilgisi */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>
                    {t('copilot.guide_title')}
                  </div>
                  <p style={{ fontSize: '13px', color: '#aaa', lineHeight: '1.6', margin: 0 }}>
                    {t('copilot.guide_p1')}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#bbb' }}>
                    <div>• <strong>{t('copilot.guide_s2')}</strong></div>
                    <div>• <strong>{t('copilot.guide_s3')}</strong></div>
                    <div>• <strong>{t('copilot.guide_s4')}</strong></div>
                    <div>• <strong>{t('copilot.guide_s5')}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SAHNE 2: RAG CHATBOT ================= */}
          {activeScene === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
              {/* Quick Questions Chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendChat(q)}
                    style={{
                      background: 'rgba(255, 170, 0, 0.1)',
                      border: '1px solid rgba(255, 170, 0, 0.25)',
                      color: '#ffbb44',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat Messages Feed */}
              <div style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '82%',
                      background: msg.sender === 'user'
                        ? 'linear-gradient(135deg, #0055ff, #0077ff)'
                        : 'rgba(255,255,255,0.06)',
                      border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      lineHeight: '1.5'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '4px', color: msg.sender === 'user' ? '#bbddff' : '#ffaa00' }}>
                      {msg.sender === 'user' ? t('copilot.operator') : t('copilot.assistant')}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    {msg.sources && (
                      <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: '#88aacc' }}>
                        Sources: {msg.sources.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
                {isChatLoading && (
                  <div style={{ color: '#ffaa00', fontSize: '13px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="spinner" style={{ width: '12px', height: '12px', border: '2px solid #ffaa00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    {t('copilot.thinking')}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder={t('copilot.type_question')}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => handleSendChat()}
                  disabled={isChatLoading || !chatInput.trim()}
                  style={{
                    background: '#ffaa00',
                    color: '#000',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0 20px',
                    cursor: isChatLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {t('copilot.send')}
                </button>
                <button
                  onClick={() => setActiveScene(3)}
                  style={{
                    background: 'linear-gradient(135deg, #00aa66, #00cc77)',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0 20px',
                    cursor: 'pointer'
                  }}
                >
                  {t('copilot.btn_next_crew')}
                </button>
              </div>
            </div>
          )}

          {/* ================= SAHNE 3: MAKİNE & EKİP SEÇİMİ ================= */}
          {activeScene === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
              <div style={{ fontSize: '15px', color: '#ccc' }}>
                {t('copilot.scene3_instruction')}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flex: 1 }}>
                {/* Sol Kolon: Makineler */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff6666', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                    {t('copilot.faulty_machines')} ({atRiskMachines.length})
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
                    {machines.map(m => {
                      const isRisk = m.status === 'at_risk'
                      const isSelected = pickedMachineId === m.id
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            setPickedMachineId(m.id)
                            setSelectedMachineId(m.id)
                          }}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '6px',
                            background: isSelected
                              ? 'rgba(255, 170, 0, 0.18)'
                              : isRisk ? 'rgba(255, 68, 68, 0.08)' : 'rgba(255,255,255,0.02)',
                            border: isSelected
                              ? '1px solid #ffaa00'
                              : isRisk ? '1px solid rgba(255, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 'bold', color: isSelected ? '#ffaa00' : '#fff', fontSize: '14px' }}>
                              {m.id}
                            </div>
                            <div style={{ fontSize: '12px', color: '#888' }}>
                              {t('copilot.fault_status')} {isRisk ? (m.fault_type || 'inner_race') : '-'} | {t('nav.live')}: %{m.life_pct?.toFixed(0)}
                            </div>
                          </div>
                          {isSelected && (
                            <span style={{ color: '#ffaa00', fontWeight: 'bold' }}>{t('copilot.selected')}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Sağ Kolon: Ekip Listesi */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#44bb77', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                    {t('copilot.crews_status')} ({crews.length})
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
                    {crews.map(c => {
                      const isAvailable = c.status === 'available'
                      const isSelected = pickedCrewId === c.id || (!pickedCrewId && isAvailable)
                      return (
                        <div
                          key={c.id}
                          onClick={() => isAvailable && setPickedCrewId(c.id)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '6px',
                            background: isSelected && isAvailable
                              ? 'rgba(68, 187, 119, 0.18)'
                              : !isAvailable ? 'rgba(255, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)',
                            border: isSelected && isAvailable
                              ? '1px solid #44bb77'
                              : !isAvailable ? '1px solid rgba(255, 68, 68, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: isAvailable ? 'pointer' : 'not-allowed',
                            opacity: isAvailable ? 1 : 0.6
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>
                              {c.id}
                            </div>
                            <div style={{ fontSize: '12px', color: isAvailable ? '#44bb77' : '#ff4444' }}>
                              {isAvailable ? t('fleet.available') : `${t('fleet.repairing')} (${c.assigned_machine_id || 'Busy'})`}
                            </div>
                          </div>
                          {isSelected && isAvailable && (
                            <span style={{ color: '#44bb77', fontWeight: 'bold' }}>{t('copilot.selected')}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Alt Buton Barı */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setActiveScene(2)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: '#ddd',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 20px',
                    cursor: 'pointer'
                  }}
                >
                  {t('copilot.btn_back_chat')}
                </button>
                <button
                  onClick={() => setActiveScene(4)}
                  style={{
                    background: 'linear-gradient(135deg, #ff8800, #ffaa00)',
                    color: '#000',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 28px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  {t('copilot.btn_next_verify')}
                </button>
              </div>
            </div>
          )}

          {/* ================= SAHNE 4: OPERATÖR SINAVI / ÇÖZÜM NE? ================= */}
          {activeScene === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '18px' }}>
              <div style={{
                background: 'rgba(255, 170, 0, 0.08)',
                border: '1px solid rgba(255, 170, 0, 0.3)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffaa00' }}>
                  {t('copilot.scene4_target')}: {pickedMachineId || targetMachine?.id} ({t('copilot.fault_status')} {isCurrentTargetAtRisk ? (targetMachine?.fault_type || 'inner_race') : '-'})
                </div>
                <div style={{ fontSize: '13px', color: '#ccc', marginTop: '4px' }}>
                  {t('copilot.scene4_instruction')}
                </div>
              </div>

              {/* Text Input Box */}
              <textarea
                placeholder={t('copilot.scene4_placeholder')}
                value={solutionInput}
                onChange={e => setSolutionInput(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  padding: '14px',
                  color: '#fff',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  outline: 'none',
                  resize: 'none'
                }}
              />

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleVerifySolution}
                  disabled={isVerifying || !solutionInput.trim()}
                  style={{
                    flex: 1,
                    background: isVerifying ? '#444' : 'linear-gradient(135deg, #0088ff, #00aaff)',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '14px',
                    fontSize: '14px',
                    cursor: isVerifying ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isVerifying ? t('copilot.scene4_verifying') : t('copilot.scene4_verify_btn')}
                </button>
              </div>

              {/* Evaluation Feedback Card */}
              {evalResult && (
                <div style={{
                  background: evalResult.is_correct ? 'rgba(68, 187, 119, 0.12)' : 'rgba(255, 68, 68, 0.12)',
                  border: evalResult.is_correct ? '1px solid #44bb77' : '1px solid #ff4444',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: evalResult.is_correct ? '#44bb77' : '#ff4444' }}>
                      {evalResult.is_correct ? t('copilot.scene4_passed') : t('copilot.scene4_failed')}
                    </div>
                    <div style={{
                      background: evalResult.is_correct ? '#44bb77' : '#ff4444',
                      color: '#000',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      padding: '3px 10px',
                      borderRadius: '12px'
                    }}>
                      {t('copilot.scene4_score')} {evalResult.score} / 100
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', color: '#ddd' }}>
                    {evalResult.feedback}
                  </div>

                  {evalResult.missing_steps && evalResult.missing_steps.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#ffaa88', marginTop: '4px' }}>
                      <strong>{t('copilot.scene4_missing')}</strong> {evalResult.missing_steps.join(', ')}
                    </div>
                  )}

                  {!evalResult.is_correct && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        onClick={() => setActiveScene(2)}
                        style={{
                          background: 'rgba(255, 170, 0, 0.2)',
                          color: '#ffaa00',
                          border: '1px solid #ffaa00',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {t('copilot.scene4_retry')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= SAHNE 5: SEVKİYAT & GÜNCEL ONARIMLAR ACCORDION ================= */}
          {activeScene === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                    {t('copilot.scene5_title')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8899aa', marginTop: '2px' }}>
                    {t('copilot.scene5_subtitle')}
                  </div>
                </div>

                <button
                  onClick={onClose}
                  style={{
                    background: 'linear-gradient(135deg, #44bb77, #22aa55)',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 20px',
                    cursor: 'pointer'
                  }}
                >
                  {t('copilot.scene5_close_btn')}
                </button>
              </div>

              {/* Accordion List of Dispatched Repairs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1 }}>
                {activeDispatchedCrews.length === 0 && Object.keys(activeRepairRecords).length === 0 ? (
                  <div style={{
                    padding: '30px',
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#888',
                    fontSize: '14px'
                  }}>
                    {t('copilot.scene5_no_active')}
                  </div>
                ) : (
                  // Map active crews + records
                  (activeDispatchedCrews.length > 0 ? activeDispatchedCrews : Object.values(activeRepairRecords)).map(item => {
                    const machineId = item.assigned_machine_id || item.machine_id
                    const crewId = item.id || item.crew_id
                    const etaTicks = item.eta_sim_hours !== undefined && item.eta_sim_hours !== null ? item.eta_sim_hours : 5
                    const progressPct = Math.round(((5 - Math.max(0, etaTicks)) / 5) * 100)
                    const isExpanded = expandedRepairId === machineId
                    const record = activeRepairRecords[machineId]

                    return (
                      <div
                        key={machineId}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: isExpanded ? '1px solid rgba(255, 170, 0, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Collapsed Header Bar */}
                        <div
                          onClick={() => setExpandedRepairId(prev => prev === machineId ? null : machineId)}
                          style={{
                            padding: '14px 18px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            background: isExpanded ? 'rgba(255, 170, 0, 0.05)' : 'transparent'
                          }}
                        >
                          <div style={{ fontWeight: 'bold', color: '#ffaa00', fontSize: '15px', minWidth: '55px' }}>
                            {machineId}
                          </div>

                          <div style={{ fontSize: '13px', color: '#ddd', minWidth: '120px' }}>
                            {t('copilot.scene5_crew')} <strong style={{ color: '#88ccff' }}>{crewId}</strong>
                          </div>

                          {/* Progress Bar with % */}
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', height: '10px', borderRadius: '6px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${progressPct}%`,
                                height: '100%',
                                background: progressPct >= 100
                                  ? 'linear-gradient(90deg, #44bb77, #66dd99)'
                                  : 'linear-gradient(90deg, #ff8800, #ffaa00)',
                                transition: 'width 0.4s ease'
                              }} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: progressPct >= 100 ? '#44bb77' : '#ffaa00', minWidth: '40px' }}>
                              %{progressPct}
                            </span>
                          </div>

                          <div style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: progressPct >= 100 ? 'rgba(68, 187, 119, 0.2)' : 'rgba(255, 170, 0, 0.2)',
                            color: progressPct >= 100 ? '#44bb77' : '#ffaa00'
                          }}>
                            {progressPct >= 100 ? t('copilot.scene5_completed') : t('copilot.scene5_repairing')}
                          </div>

                          <div style={{ color: '#888', fontSize: '12px' }}>
                            {isExpanded ? '▲' : '▼'}
                          </div>
                        </div>

                        {/* Expanded Details Body */}
                        {isExpanded && (
                          <div style={{
                            padding: '16px 18px',
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(0,0,0,0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            fontSize: '13px'
                          }}>
                            <div>
                              <span style={{ color: '#ff6666', fontWeight: 'bold' }}>{t('copilot.scene5_problem')} </span>
                              <span style={{ color: '#eee' }}>
                                {record?.problem || (language === 'tr' ? 'Rulman iç/dış bilezik aşınması ve yüksek titreşim anomalisi.' : 'Bearing raceway wear and high vibration anomaly.')}
                              </span>
                            </div>

                            <div>
                              <span style={{ color: '#44bb77', fontWeight: 'bold' }}>{t('copilot.scene5_solution')} </span>
                              <span style={{ color: '#ddd', lineHeight: '1.5' }}>
                                {record?.solution || (language === 'tr' ? 'LOTO izolasyonu, şaft kontrolü, indüksiyonla ısıtılarak yeni rulman montajı ve gres dolumu.' : 'LOTO isolation, shaft runout inspection, induction heating assembly to 110°C and grease packing.')}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#8899aa', marginTop: '4px' }}>
                              <div>{t('copilot.scene5_started')} <strong style={{ color: '#ccc' }}>{record?.started_at || (language === 'tr' ? 'Şimdi' : 'Now')}</strong></div>
                              <div>{t('copilot.scene5_remaining')} <strong style={{ color: '#ffaa00' }}>{etaTicks} {t('fleet.ticks_left')}</strong></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
