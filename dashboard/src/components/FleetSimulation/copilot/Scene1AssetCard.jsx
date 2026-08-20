import React from 'react'

export function Scene1AssetCard({ targetMachine, isCurrentTargetAtRisk, t }) {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      {/* Top Alert Banner */}
      <div style={{
        background: isCurrentTargetAtRisk
          ? 'linear-gradient(135deg, rgba(255, 68, 68, 0.12), rgba(255, 170, 0, 0.08))'
          : 'rgba(68, 187, 119, 0.08)',
        border: isCurrentTargetAtRisk
          ? '1px solid rgba(255, 68, 68, 0.4)'
          : '1px solid rgba(68, 187, 119, 0.3)',
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

      {/* Grid Panels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        flex: 1
      }}>
        {/* Left: Asset Parameters */}
        <div className="copilot-panel">
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

        {/* Right: Technical Guidelines */}
        <div className="copilot-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
  )
}
