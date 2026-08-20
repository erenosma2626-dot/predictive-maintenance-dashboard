import React, { useRef, useEffect } from 'react'

export function Scene2ChatAssistant({
  chatMessages,
  isChatLoading,
  chatInput,
  setChatInput,
  handleSendChat,
  quickQuestions,
  onProceedToCrew,
  t
}) {
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isChatLoading])

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
      {/* Quick Questions Chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendChat(q)}
            className="copilot-chip"
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
          onClick={onProceedToCrew}
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
  )
}
