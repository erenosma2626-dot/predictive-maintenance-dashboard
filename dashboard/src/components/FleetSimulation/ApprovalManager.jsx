import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabaseClient'
import { API_ENDPOINTS } from '../../config/api'

export function ApprovalManager() {
  const [isApprovalEnabled, setIsApprovalEnabled] = useState(false)
  const [pendingApprovals, setPendingApprovals] = useState({})
  const [isLoadingToggle, setIsLoadingToggle] = useState(false)
  const [loadingDecision, setLoadingDecision] = useState(null)

  // Load initial toggle state
  useEffect(() => {
    const fetchSetting = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'human_approval_enabled')
        .single()
      
      if (data && data.value === 'true') {
        setIsApprovalEnabled(true)
      } else {
        setIsApprovalEnabled(false)
      }
    }
    fetchSetting()
  }, [])

  // Poll for pending approvals
  useEffect(() => {
    if (!isApprovalEnabled) {
      setPendingApprovals({})
      return
    }

    const checkPending = async () => {
      try {
        const datasets = ['bearing', 'cmapss']
        const newPending = {}
        
        for (const ds of datasets) {
          const res = await fetch(API_ENDPOINTS.PENDING_APPROVALS(ds))
          if (res.ok) {
            const data = await res.json()
            if (data.pending && data.details) {
              newPending[ds] = data.details
            }
          }
        }
        setPendingApprovals(newPending)
      } catch (err) {
        // ignore fetch errors silently on interval
      }
    }

    checkPending()
    const interval = setInterval(checkPending, 3000)
    return () => clearInterval(interval)
  }, [isApprovalEnabled])

  const handleToggle = async () => {
    setIsLoadingToggle(true)
    const newValue = !isApprovalEnabled
    setIsApprovalEnabled(newValue)
    
    // Update Supabase
    await supabase
      .from('app_settings')
      .update({ value: newValue ? 'true' : 'false' })
      .eq('key', 'human_approval_enabled')
      
    setIsLoadingToggle(false)
  }

  const handleDecision = async (dataset, approved) => {
    setLoadingDecision(`${dataset}-${approved}`)
    try {
      await fetch(API_ENDPOINTS.APPROVE_DISPATCH(dataset, approved), {
        method: 'POST'
      })
      // Optimistically remove from state
      setPendingApprovals(prev => {
        const next = { ...prev }
        delete next[dataset]
        return next
      })
    } catch (err) {
      console.error('Failed to send decision', err)
    } finally {
      setLoadingDecision(null)
    }
  }

  return (
    <div style={{
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      width: '100%'
    }}>
      {/* Toggle Button */}
      <div style={{
        background: 'rgba(15, 15, 18, 0.9)',
        padding: '10px 15px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
      }}>
        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#ccc' }}>
          Require approval before crew dispatch
        </span>
        <div 
          onClick={isLoadingToggle ? null : handleToggle}
          style={{
            width: '40px',
            height: '20px',
            background: isApprovalEnabled ? '#ffaa00' : '#444',
            borderRadius: '10px',
            position: 'relative',
            cursor: isLoadingToggle ? 'wait' : 'pointer',
            transition: 'background 0.3s'
          }}
        >
          <div style={{
            width: '16px',
            height: '16px',
            background: '#fff',
            borderRadius: '50%',
            position: 'absolute',
            top: '2px',
            left: isApprovalEnabled ? '22px' : '2px',
            transition: 'left 0.3s'
          }} />
        </div>
      </div>

      {/* Pending Approval Panels Container */}
      <div style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
      {Object.entries(pendingApprovals).map(([dataset, details]) => (
        <div key={dataset} style={{
          background: 'rgba(30, 20, 10, 0.95)',
          border: '1px solid #ffaa00',
          borderRadius: '8px',
          padding: '15px',
          width: '260px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.7)',
          animation: 'pulse-glow 2s infinite alternate',
          fontFamily: 'monospace',
          fontSize: '13px'
        }}>
          <div style={{ 
            color: '#ffaa00', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>⚠️</span> 
            APPROVAL NEEDED ({dataset.toUpperCase()})
          </div>
          <div style={{ color: '#ccc', marginBottom: '5px' }}>
            Machine: <span style={{ color: '#fff', fontWeight: 'bold' }}>{details.machine_id}</span>
          </div>
          <div style={{ color: '#ccc', marginBottom: '15px' }}>
            Proposed crew: <span style={{ color: '#fff', fontWeight: 'bold' }}>{details.crew_id}</span>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => handleDecision(dataset, true)}
              disabled={!!loadingDecision}
              style={{
                flex: 1,
                padding: '8px',
                background: '#00aa55',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {loadingDecision === `${dataset}-true` ? '...' : 'Approve'}
            </button>
            <button 
              onClick={() => handleDecision(dataset, false)}
              disabled={!!loadingDecision}
              style={{
                flex: 1,
                padding: '8px',
                background: '#aa3333',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {loadingDecision === `${dataset}-false` ? '...' : 'Reject'}
            </button>
          </div>
        </div>
      ))}
      </div>
    </div>
  )
}
