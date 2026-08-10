import React, { useState } from 'react'
import { useFleetSimulation } from '../../contexts/FleetSimulationContext'
import { useLanguage } from '../../contexts/LanguageContext'

export function Box4MonthlyReports({ dataset = 'bearing' }) {
  const { monthlyReports } = useFleetSimulation()
  const { t } = useLanguage()
  const [selectedReport, setSelectedReport] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleTriggerReport = async () => {
    setIsGenerating(true)
    try {
      await fetch(`http://127.0.0.1:8001/trigger-monthly-report?dataset_type=${dataset}`, {
        method: 'POST'
      })
    } catch (e) {
      console.error(e)
    }
    setTimeout(() => setIsGenerating(false), 2000)
  }

  return (
    <>
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{t('fleet.monthly_reports')}</span>
        <button 
          onClick={handleTriggerReport} 
          disabled={isGenerating}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
        >
          {isGenerating ? '...' : '+ FORCE REPORT'}
        </button>
      </div>
      <div className="scrollable-content">
        {monthlyReports.length === 0 ? (
          <div style={{ opacity: 0.5, padding: '10px' }}>{t('fleet.no_reports')}</div>
        ) : (
          monthlyReports.map(report => (
            <div 
              key={report.id} 
              className="list-row"
              onClick={() => setSelectedReport(report)}
            >
              <span>📄 {t('fleet.month')} {report.month_number}</span>
              <span style={{ opacity: 0.7 }}>{t('fleet.net')} ${report.net_value.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>

      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="report-modal" onClick={e => e.stopPropagation()}>
            <button className="report-modal-close" onClick={() => setSelectedReport(null)}>&times;</button>
            <h2>MONTHLY FLEET REPORT</h2>
            <div style={{ textAlign: 'center', opacity: 0.7, marginBottom: '30px' }}>
              Period: Month {selectedReport.month_number}
            </div>

            <div className="executive-summary">
              {selectedReport.detail_json?.summary || "No executive summary available."}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '10px 0' }}><strong>Planned Repairs</strong></td>
                  <td style={{ textAlign: 'right' }}>{selectedReport.planned_count}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '10px 0' }}><strong>Unplanned Failures</strong></td>
                  <td style={{ textAlign: 'right' }}>{selectedReport.unplanned_count}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '10px 0' }}><strong>Unavailability (Queued)</strong></td>
                  <td style={{ textAlign: 'right' }}>{selectedReport.detail_json?.queued_count || 0}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ccc', color: '#c00' }}>
                  <td style={{ padding: '10px 0' }}><strong>Total Downtime Cost</strong></td>
                  <td style={{ textAlign: 'right' }}>${Math.abs(selectedReport.total_downtime_cost).toLocaleString()}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ccc', color: '#080' }}>
                  <td style={{ padding: '10px 0' }}><strong>Total Value Preserved</strong></td>
                  <td style={{ textAlign: 'right' }}>${selectedReport.total_value_preserved.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '15px 0', fontSize: '18px' }}><strong>NET VALUE</strong></td>
                  <td style={{ textAlign: 'right', fontSize: '18px', fontWeight: 'bold', color: selectedReport.net_value >= 0 ? '#080' : '#c00' }}>
                    ${selectedReport.net_value.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
