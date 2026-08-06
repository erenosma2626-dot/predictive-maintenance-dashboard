import React, { useState } from 'react';
import Navigation from './components/Navigation';
import LivePage from './pages/LivePage';
import BusinessValuePage from './pages/BusinessValuePage';
import DatasetDeepDivePage from './pages/DatasetDeepDivePage';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('LIVE');

  return (
    <div className="app-container">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {activeTab === 'LIVE' && <LivePage />}
        {activeTab === 'BUSINESS VALUE' && <BusinessValuePage />}
        {activeTab === 'DATASET DEEP-DIVE' && <DatasetDeepDivePage />}
      </main>
    </div>
  );
}

export default App;
