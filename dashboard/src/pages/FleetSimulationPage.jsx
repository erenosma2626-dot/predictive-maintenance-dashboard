import React from 'react'
import { FleetSimulationProvider } from '../contexts/FleetSimulationContext'
import { Box1FleetOverview } from '../components/FleetSimulation/Box1FleetOverview'
import { Box2Diagnosis } from '../components/FleetSimulation/Box2Diagnosis'
import { Box3PriorityQueue } from '../components/FleetSimulation/Box3PriorityQueue'
import { Box4MonthlyReports } from '../components/FleetSimulation/Box4MonthlyReports'
import { Box5CrewRoster } from '../components/FleetSimulation/Box5CrewRoster'
import { AgentsStatusOverlay } from '../components/FleetSimulation/AgentsStatusOverlay'
import { SimulationClock } from '../components/FleetSimulation/SimulationClock'
import { FleetSimulationAboutPanel } from '../components/FleetSimulation/FleetSimulationAboutPanel'
import { ApprovalManager } from '../components/FleetSimulation/ApprovalManager'
import { SimulationLoadingScreen } from '../components/FleetSimulation/SimulationLoadingScreen'
import './FleetSimulationPage.css'

export default function FleetSimulationPage({ dataset }) {
  const [isLoading, setIsLoading] = React.useState(() => {
    return !sessionStorage.getItem('fleetSimLoaded')
  })

  const handleComplete = () => {
    sessionStorage.setItem('fleetSimLoaded', 'true')
    setIsLoading(false)
  }

  return (
    <div className="fleet-simulation-container">
      {isLoading && <SimulationLoadingScreen onComplete={handleComplete} />}
      <FleetSimulationAboutPanel dataset={dataset} />
      
      <div className="fleet-grid">
        <div className="grid-area-overview panel-box">
          <Box1FleetOverview />
        </div>
        <div className="grid-area-diagnosis panel-box">
          <Box2Diagnosis dataset={dataset} />
        </div>
        <div className="grid-area-priority panel-box">
          <Box3PriorityQueue />
        </div>
        
        {/* Right Column */}
        <div style={{ gridColumn: 3, gridRow: '1 / 3', display: 'flex', flexDirection: 'column', gap: '15px', minHeight: 0 }}>
          <div className="panel-box" style={{ flex: '0.9', minHeight: 0 }}>
            <Box4MonthlyReports dataset={dataset} />
          </div>
          
          <ApprovalManager />
          
          <div className="panel-box" style={{ flex: '0.9', minHeight: 0 }}>
            <Box5CrewRoster dataset={dataset} />
          </div>
        </div>
      </div>

      <AgentsStatusOverlay dataset={dataset} />
      <SimulationClock dataset={dataset} />
    </div>
  )
}
