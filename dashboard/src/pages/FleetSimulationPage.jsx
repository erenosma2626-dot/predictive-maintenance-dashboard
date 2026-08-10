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
import './FleetSimulationPage.css'

export default function FleetSimulationPage({ dataset }) {
  return (
    <FleetSimulationProvider dataset={dataset}>
      <div className="fleet-simulation-container">
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
          <div className="grid-area-reports panel-box">
            <Box4MonthlyReports dataset={dataset} />
          </div>
          <div className="grid-area-roster panel-box">
            <Box5CrewRoster />
          </div>
        </div>
        
        {/* Agent Status Bar at the bottom */}
        <AgentsStatusOverlay />
      </div>
    </FleetSimulationProvider>
  )
}
