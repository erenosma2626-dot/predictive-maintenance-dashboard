import React from 'react'
import { FleetSimulationProvider } from '../contexts/FleetSimulationContext'
import { BearingChatProvider } from '../contexts/BearingChatContext'
import { Box1FleetOverview } from '../components/FleetSimulation/Box1FleetOverview'
import { Box2Diagnosis } from '../components/FleetSimulation/Box2Diagnosis'
import { Box3PriorityQueue } from '../components/FleetSimulation/Box3PriorityQueue'
import { Box4MonthlyReports } from '../components/FleetSimulation/Box4MonthlyReports'
import { Box5CrewRoster } from '../components/FleetSimulation/Box5CrewRoster'
import { AgentsStatusOverlay } from '../components/FleetSimulation/AgentsStatusOverlay'
import { SimulationClock } from '../components/FleetSimulation/SimulationClock'
import { FleetSimulationAboutPanel } from '../components/FleetSimulation/FleetSimulationAboutPanel'
import { ApprovalManager } from '../components/FleetSimulation/ApprovalManager'
import { ManualCrewModeController } from '../components/FleetSimulation/ManualCrewModeController'
import { BearingCopilotModal } from '../components/FleetSimulation/BearingCopilotModal'
import { BearingFloatingWidget } from '../components/FleetSimulation/BearingFloatingWidget'
import { SimulationLoadingScreen } from '../components/FleetSimulation/SimulationLoadingScreen'
import './FleetSimulationPage.css'

export default function FleetSimulationPage({ dataset }) {
  const [isCopilotOpen, setIsCopilotOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(() => {
    return !sessionStorage.getItem('fleetSimLoaded')
  })

  const handleComplete = () => {
    sessionStorage.setItem('fleetSimLoaded', 'true')
    setIsLoading(false)
  }

  return (
    <BearingChatProvider>
      <div className="fleet-simulation-container">
        {isLoading && <SimulationLoadingScreen onComplete={handleComplete} />}
        <FleetSimulationAboutPanel dataset={dataset} />
        
        {/* 2D Top-Down Bearing Siri-like Floating Chatbot Button & Widget */}
        <BearingFloatingWidget dataset={dataset} />

        <div className="fleet-grid">
          <div className="grid-area-overview panel-box">
            <Box1FleetOverview />
          </div>
          <div className="grid-area-diagnosis panel-box">
            <Box2Diagnosis dataset={dataset} onOpenCopilot={() => setIsCopilotOpen(true)} />
          </div>
          <div className="grid-area-priority panel-box">
            <Box3PriorityQueue />
          </div>
          
          {/* Right Column */}
          <div style={{ gridColumn: 3, gridRow: '1 / 3', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
            <div className="panel-box" style={{ flex: '0.9', minHeight: 0 }}>
              <Box4MonthlyReports dataset={dataset} />
            </div>
            
            <ManualCrewModeController dataset={dataset} onOpenCopilot={() => setIsCopilotOpen(true)} />
            <ApprovalManager />
            
            <div className="panel-box" style={{ flex: '0.9', minHeight: 0 }}>
              <Box5CrewRoster dataset={dataset} />
            </div>
          </div>
        </div>

        <AgentsStatusOverlay dataset={dataset} />
        <SimulationClock dataset={dataset} />

        {dataset === 'bearing' && (
          <BearingCopilotModal
            isOpen={isCopilotOpen}
            onClose={() => setIsCopilotOpen(false)}
          />
        )}
      </div>
    </BearingChatProvider>
  )
}
