import React, { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

export function FleetSimulationAboutPanel({ dataset = 'bearing' }) {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useLanguage()

  if (!isOpen) {
    return (
      <div 
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 1000
        }}
      >
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            background: 'rgba(30, 100, 255, 0.2)',
            border: '2px solid rgba(100, 150, 255, 0.5)',
            borderRadius: '8px',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: '14px',
            padding: '12px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            fontWeight: 'bold',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = 'rgba(30, 100, 255, 0.4)'
            e.currentTarget.style.borderColor = 'rgba(150, 200, 255, 0.8)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'rgba(30, 100, 255, 0.2)'
            e.currentTarget.style.borderColor = 'rgba(100, 150, 255, 0.5)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <span>[i]</span> {t('fleet.about')}
        </button>
      </div>
    )
  }

  return (
    <div 
      style={{
        position: 'absolute',
        bottom: '80px',
        right: '20px',
        zIndex: 1000,
        width: '450px',
        maxHeight: '60vh',
        overflowY: 'auto',
        background: 'rgba(15, 15, 18, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '6px',
        padding: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#aaa',
        lineHeight: '1.5'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
        <span style={{ color: '#ddd', fontWeight: 'bold', letterSpacing: '1px' }}>{t('fleet.about_title')}</span>
        <button 
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ color: '#ffaa00', marginBottom: '5px' }}>{t('fleet.about_what')}</div>
        <div>
          {dataset === 'cmapss' ? t('fleet.about_what_cmapss') : t('fleet.about_what_bearing')}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ color: '#ffaa00', marginBottom: '5px' }}>{t('fleet.about_time')}</div>
        <div>
          {t('fleet.about_time_desc')}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ color: '#ffaa00', marginBottom: '5px' }}>{t('fleet.about_numbers')}</div>
        <div>
          {t('fleet.about_numbers_p1')}<br/><br/>
          {dataset === 'cmapss' ? t('fleet.about_numbers_cmapss') : t('fleet.about_numbers_bearing')}<br/><br/>
          <span style={{ color: '#ddd' }}>{t('fleet.about_numbers_important')}</span>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ color: '#ffaa00', marginBottom: '5px' }}>
          {dataset === 'cmapss' ? t('fleet.about_fault_cmapss') : t('fleet.about_fault_bearing')}
        </div>
        <div>
          {dataset === 'cmapss' ? t('fleet.about_fault_cmapss_desc') : t('fleet.about_fault_bearing_desc')}
        </div>
      </div>

      <div>
        <div style={{ color: '#ffaa00', marginBottom: '5px' }}>{t('fleet.about_agents')}</div>
        <ul style={{ paddingLeft: '15px', margin: 0 }}>
          <li style={{ marginBottom: '5px' }}><strong>{t('fleet.about_agents_mon')}</strong>{t('fleet.about_agents_mon_desc')}</li>
          <li style={{ marginBottom: '5px' }}><strong>{t('fleet.about_agents_diag')}</strong>{t('fleet.about_agents_diag_desc')}</li>
          <li style={{ marginBottom: '5px' }}><strong>{t('fleet.about_agents_plan')}</strong>{t('fleet.about_agents_plan_desc')}</li>
          <li style={{ marginBottom: '5px' }}><strong>{t('fleet.about_agents_rep')}</strong>{t('fleet.about_agents_rep_desc')}</li>
        </ul>
        <div style={{ marginTop: '10px' }}>
          {t('fleet.about_agents_note')}
        </div>
      </div>
      <div>
        <div style={{ color: '#ffaa00', marginBottom: '5px', marginTop: '20px' }}>{t('fleet.about_escalation')}</div>
        <div style={{ marginTop: '10px' }}>
          {t('fleet.about_escalation_desc')}
        </div>
      </div>
    </div>
  )
}
