import React from 'react'

export function Scene4SopExam({
  pickedMachineId,
  targetMachine,
  isCurrentTargetAtRisk,
  solutionInput,
  setSolutionInput,
  handleVerifySolution,
  isVerifying,
  evalResult,
  onRetryChat,
  t
}) {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '18px' }}>
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
                onClick={onRetryChat}
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
  )
}
