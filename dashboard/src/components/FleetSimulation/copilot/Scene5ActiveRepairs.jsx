import React from 'react'

export function Scene5ActiveRepairs({
  activeDispatchedCrews,
  activeRepairRecords,
  expandedRepairId,
  setExpandedRepairId,
  language,
  onClose,
  t
}) {
  const hasActiveRepairs = activeDispatchedCrews.length > 0 || Object.keys(activeRepairRecords).length > 0

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
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
        {!hasActiveRepairs ? (
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
  )
}
