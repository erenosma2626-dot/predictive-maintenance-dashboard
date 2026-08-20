import React, { useState, lazy, Suspense } from 'react';
import Navigation from './components/Navigation';
import LivePage from './pages/LivePage';
import { useLiveStream } from './hooks/useLiveStream';
import { LanguageProvider } from './contexts/LanguageContext';
import { FleetSimulationProvider } from './contexts/FleetSimulationContext';
import './App.css';

// Lazy load non-default tabs to dramatically reduce initial bundle size
const BusinessValuePage = lazy(() => import('./pages/BusinessValuePage'));
const DatasetDeepDivePage = lazy(() => import('./pages/DatasetDeepDivePage'));
const SyntheticDataPage = lazy(() => import('./pages/SyntheticDataPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const FleetSimulationPage = lazy(() => import('./pages/FleetSimulationPage'));

function TabLoadingFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#ffaa00', gap: '10px' }}>
      <div style={{ width: '16px', height: '16px', border: '2px solid #ffaa00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>Loading Module...</span>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('LIVE');
  const [dataset, setDataset] = useState('bearing'); // 'cmapss' or 'bearing'

  // Only stream live telemetry when on tabs that actually consume it
  const isLiveStreamActive = activeTab === 'LIVE' || activeTab === 'SYNTHETIC DATA';
  const { currentData, history, logs, isAlert } = useLiveStream(dataset, isLiveStreamActive);

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
          
          <Suspense fallback={<TabLoadingFallback />}>
            {activeTab === 'BUSINESS VALUE' && <BusinessValuePage dataset={dataset} />}
            {activeTab === 'SYNTHETIC DATA' && <SyntheticDataPage dataset={dataset} currentData={currentData} history={history} />}
            {activeTab === 'FLEET SIMULATION' && <FleetSimulationPage dataset={dataset} />}
            {activeTab === 'DATASET DEEP-DIVE' && <DatasetDeepDivePage dataset={dataset} />}
            {activeTab === 'RESOURCES' && <ResourcesPage />}
          </Suspense>
        </main>
      </div>
      </FleetSimulationProvider>
    </LanguageProvider>
  );
}

export default App;
