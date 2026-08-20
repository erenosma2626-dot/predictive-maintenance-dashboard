import React, { useState, useRef, useEffect } from 'react'
import { useBearingChat } from '../../contexts/BearingChatContext'
import { useFleetSimulation } from '../../contexts/FleetSimulationContext'
import { useLanguage } from '../../contexts/LanguageContext'
import './BearingFloatingWidget.css'

export function BearingFloatingWidget({ dataset = 'bearing' }) {
  const {
    chatMessages,
    isChatLoading,
    sendChatMessage,
    isFloatingChatOpen,
    setIsFloatingChatOpen
  } = useBearingChat()

  const { machines, selectedMachineId } = useFleetSimulation()
  const { t, language } = useLanguage()
  const [inputVal, setInputVal] = useState('')
  const [isHovered, setIsHovered] = useState(false)
  const messagesEndRef = useRef(null)

  const selectedMachine = machines.find(m => m.id === selectedMachineId) || machines[0]

  useEffect(() => {
    if (isFloatingChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, isChatLoading, isFloatingChatOpen])

  if (dataset !== 'bearing') return null

  const handleSend = (text) => {
    const q = text || inputVal
    if (!q || !q.trim()) return
    sendChatMessage(q, selectedMachine?.id, selectedMachine?.fault_type)
    if (!text) setInputVal('')
  }

  const quickQuestions = language === 'tr' ? [
    `${selectedMachine?.id || 'M01'} için gres miktarı ne?`,
    `Montaj sıcaklığı kaç derece?`,
    `İç bilezik arıza SOP adımları?`
  ] : [
    `Grease amount for ${selectedMachine?.id || 'M01'}?`,
    `Mounting temperature?`,
    `Inner race fault SOP steps?`
  ]

  return (
    <>
      {/* 2D Top-Down Bearing Icon Button */}
      <div className="floating-widget-btn-wrapper">
        {/* Tooltip on Hover */}
        {isHovered && !isFloatingChatOpen && (
          <div className="floating-widget-tooltip">
            {t('copilot.chatbot_tooltip')}
            <div className="floating-widget-tooltip-arrow" />
          </div>
        )}

        <button
          onClick={() => setIsFloatingChatOpen(prev => !prev)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title=""
          className={`floating-bearing-btn ${isFloatingChatOpen ? 'active' : ''}`}
        >
          {/* 2D Top-Down Bearing SVG Icon */}
          <svg
            width="36"
            height="36"
            viewBox="0 0 100 100"
            style={{
              animation: isFloatingChatOpen ? 'spin 12s linear infinite' : 'none'
            }}
          >
            {/* Outer Ring */}
            <circle cx="50" cy="50" r="44" fill="none" stroke="#ffffff" strokeWidth="5.5" opacity="0.95" />
            <circle cx="50" cy="50" r="36" fill="none" stroke="#b0c4de" strokeWidth="2.5" opacity="0.75" />

            {/* Inner Ring */}
            <circle cx="50" cy="50" r="22" fill="none" stroke="#b0c4de" strokeWidth="2.5" opacity="0.75" />
            <circle cx="50" cy="50" r="14" fill="none" stroke="#ffffff" strokeWidth="5.5" opacity="0.95" />

            {/* Center Shaft Hole */}
            <circle cx="50" cy="50" r="7" fill="none" stroke="#8899aa" strokeWidth="2" opacity="0.6" />

            {/* 8 Rolling Balls (Bilyeler) */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
              const rad = (deg * Math.PI) / 180
              const bx = 50 + 29 * Math.cos(rad)
              const by = 50 + 29 * Math.sin(rad)
              return (
                <g key={i}>
                  <circle
                    cx={bx}
                    cy={by}
                    r="6"
                    fill={isFloatingChatOpen ? '#ffaa00' : '#ffffff'}
                    stroke={isFloatingChatOpen ? '#ff8800' : '#c0d2e8'}
                    strokeWidth="1.5"
                  />
                  {/* Ball Highlight */}
                  <circle cx={bx - 1.8} cy={by - 1.8} r="1.8" fill="#ffffff" opacity="0.9" />
                </g>
              )
            })}
          </svg>
        </button>
      </div>

      {/* Floating Phone-like Chat Drawer / Card */}
      {isFloatingChatOpen && (
        <div className="floating-drawer-card">
          {/* Status Bar */}
          <div style={{
            padding: '12px 18px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#44bb77',
                boxShadow: '0 0 6px #44bb77'
              }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>
                  {t('copilot.chatbot_title')}
                </div>
                <div style={{ fontSize: '10px', color: '#8899aa' }}>
                  {selectedMachine ? `${t('copilot.target_machine')}: ${selectedMachine.id}` : t('copilot.groq_active')}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsFloatingChatOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#888',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Quick Question Chips */}
          <div style={{
            padding: '8px 12px',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            background: 'rgba(0,0,0,0.2)',
            borderBottom: '1px solid rgba(255,255,255,0.04)'
          }}>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                style={{
                  background: 'rgba(100, 160, 255, 0.1)',
                  border: '1px solid rgba(100, 160, 255, 0.25)',
                  color: '#99c2ff',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {chatMessages.map((msg, i) => {
              const isUser = msg.sender === 'user'
              return (
                <div
                  key={i}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: isUser
                      ? 'linear-gradient(135deg, #0066ff, #0088ff)'
                      : 'rgba(255,255,255,0.06)',
                    border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    lineHeight: '1.45',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: '10px',
                    marginBottom: '3px',
                    color: isUser ? '#cce0ff' : '#ffaa00'
                  }}>
                    {isUser ? t('copilot.operator') : t('copilot.assistant')}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  {msg.sources && (
                    <div style={{
                      marginTop: '6px',
                      paddingTop: '4px',
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      fontSize: '10px',
                      color: '#88aacc'
                    }}>
                      Source: {msg.sources[0]}
                    </div>
                  )}
                </div>
              )
            })}
            {isChatLoading && (
              <div style={{ color: '#ffaa00', fontSize: '11px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="spinner" style={{ width: '10px', height: '10px', border: '2px solid #ffaa00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                {t('copilot.thinking')}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: '10px 12px',
            background: 'rgba(0,0,0,0.3)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              placeholder={t('copilot.type_question')}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={isChatLoading || !inputVal.trim()}
              style={{
                background: '#0088ff',
                color: '#fff',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '8px',
                padding: '0 14px',
                fontSize: '12px',
                cursor: isChatLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {t('copilot.send')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
