import React, { useState } from 'react';
import Navigation from './components/Navigation';
import LivePage from './pages/LivePage';
import BusinessValuePage from './pages/BusinessValuePage';
import DatasetDeepDivePage from './pages/DatasetDeepDivePage';
import SyntheticDataPage from './pages/SyntheticDataPage';
import { useLiveStream } from './hooks/useLiveStream';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('LIVE');
  const [dataset, setDataset] = useState('cmapss'); // 'cmapss' or 'bearing'

  const { currentData, history, logs, isAlert } = useLiveStream(dataset);

  return (
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
        {activeTab === 'DATASET DEEP-DIVE' && <DatasetDeepDivePage dataset={dataset} />}
      </main>
    </div>
  );
}

export default App;
