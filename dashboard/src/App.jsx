import React, { useState } from 'react';
import Navigation from './components/Navigation';
import LivePage from './pages/LivePage';
import BusinessValuePage from './pages/BusinessValuePage';
import DatasetDeepDivePage from './pages/DatasetDeepDivePage';
import SyntheticDataPage from './pages/SyntheticDataPage';
import ResourcesPage from './pages/ResourcesPage';
import FleetSimulationPage from './pages/FleetSimulationPage';
import { useLiveStream } from './hooks/useLiveStream';
import { LanguageProvider } from './contexts/LanguageContext';
import { FleetSimulationProvider } from './contexts/FleetSimulationContext';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('LIVE');
  const [dataset, setDataset] = useState('cmapss'); // 'cmapss' or 'bearing'

  const { currentData, history, logs, isAlert } = useLiveStream(dataset);

  return (
    <LanguageProvider>
      <FleetSimulationProvider dataset={dataset}>
        <div className="app-container">
          <Navigation 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            dataset={dataset} 
            setDataset={setDataset} 
          />
        
        <main className="main-content">
          {activeTab === 'LIVE' && <LivePage dataset={dataset} currentData={currentData} history={history} logs={logs} isAlert={isAlert} />}
          {activeTab === 'BUSINESS VALUE' && <BusinessValuePage dataset={dataset} />}
          {activeTab === 'SYNTHETIC DATA' && <SyntheticDataPage dataset={dataset} currentData={currentData} history={history} />}
          {activeTab === 'FLEET SIMULATION' && <FleetSimulationPage dataset={dataset} />}
          {activeTab === 'DATASET DEEP-DIVE' && <DatasetDeepDivePage dataset={dataset} />}
          {activeTab === 'RESOURCES' && <ResourcesPage />}
        </main>
      </div>
      </FleetSimulationProvider>
    </LanguageProvider>
  );
}

export default App;
