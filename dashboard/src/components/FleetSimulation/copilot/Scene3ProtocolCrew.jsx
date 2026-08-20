import React from 'react'

export function Scene3ProtocolCrew({
  machines,
  atRiskMachines,
  crews,
  pickedMachineId,
  setPickedMachineId,
  setSelectedMachineId,
  pickedCrewId,
  setPickedCrewId,
  onBackToChat,
  onProceedToVerify,
  t
}) {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      <div style={{ fontSize: '15px', color: '#ccc' }}>
        {t('copilot.scene3_instruction')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flex: 1 }}>
        {/* Left: Machine Selection */}
        <div className="copilot-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

        {/* Right: Crew Selection */}
        <div className="copilot-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

      {/* Bottom Button Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          onClick={onBackToChat}
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
          onClick={onProceedToVerify}
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
  )
}
