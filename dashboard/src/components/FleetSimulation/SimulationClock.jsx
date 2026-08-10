import React, { useEffect, useState } from 'react'
import { useFleetSimulation } from '../../contexts/FleetSimulationContext'

export function SimulationClock() {
  const { monthlyReports, events } = useFleetSimulation()
  
  // Derive month and year from reports length
  const totalMonths = monthlyReports.length + 1
  const year = Math.floor((totalMonths - 1) / 12) + 1
  const month = ((totalMonths - 1) % 12) + 1

  // Derive day from the latest event timestamp if possible, or just a rough count of events
  // To prevent it from looking like it "resets" when switching datasets, we can use 
  // a mock day that progresses based on real time, since the simulation never actually stops.
  const [day, setDay] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setDay(prev => prev >= 30 ? 1 : prev + 1)
    }, 3000) // 1 day = 1 tick (3 seconds)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      display: 'flex',
      gap: '15px',
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ddd',
      letterSpacing: '1px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ fontSize: '10px', color: '#ffaa00' }}>YEAR</span>
        <span>{year.toString().padStart(2, '0')}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ fontSize: '10px', color: '#ffaa00' }}>MONTH</span>
        <span>{month.toString().padStart(2, '0')}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ fontSize: '10px', color: '#ffaa00' }}>DAY</span>
        <span>{day.toString().padStart(2, '0')}</span>
      </div>
    </div>
  )
}
