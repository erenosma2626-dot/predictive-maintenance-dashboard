import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabaseClient'
import { useLanguage } from '../../contexts/LanguageContext'

export function ManualCrewModeController({ dataset = 'bearing' }) {
  const [isManualMode, setIsManualMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    const fetchSetting = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', `manual_crew_mode_${dataset}`)
        .single()

      if (data && data.value === 'true') {
        setIsManualMode(true)
      } else {
        setIsManualMode(false)
      }
    }
    fetchSetting()
  }, [dataset])

  const handleToggle = async () => {
    setLoading(true)
    const nextVal = !isManualMode
    setIsManualMode(nextVal)

    try {
      await supabase
        .from('app_settings')
        .upsert({
          key: `manual_crew_mode_${dataset}`,
          value: nextVal ? 'true' : 'false'
        })
    } catch (err) {
      console.error('Failed to toggle manual crew mode:', err)
    } finally {
      setLoading(false)
    }
  }

  // Only show for bearing dataset where 5-scene copilot is configured
  if (dataset !== 'bearing') return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(20, 24, 38, 0.95), rgba(12, 14, 24, 0.98))',
      border: isManualMode ? '1px solid rgba(255, 170, 0, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '8px',
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      boxShadow: isManualMode ? '0 0 16px rgba(255, 170, 0, 0.15)' : 'none',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: isManualMode ? '#ffaa00' : '#44bb77',
          boxShadow: isManualMode ? '0 0 8px #ffaa00' : '0 0 6px #44bb77'
        }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', letterSpacing: '0.3px' }}>
            {t('copilot.manual_mode_title')}
          </div>
          <div style={{ fontSize: '11px', color: isManualMode ? '#ffbb44' : '#8899aa' }}>
            {t('copilot.manual_mode_desc')}
          </div>
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={loading}
        style={{
          background: isManualMode ? '#ffaa00' : 'rgba(255,255,255,0.1)',
          color: isManualMode ? '#111' : '#ccc',
          border: isManualMode ? '1px solid #ffaa00' : '1px solid rgba(255,255,255,0.2)',
          borderRadius: '20px',
          padding: '4px 16px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        {loading ? '...' : isManualMode ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}
