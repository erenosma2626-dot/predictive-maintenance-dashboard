import React from 'react';
import './Navigation.css';

const Navigation = ({ activeTab, setActiveTab, dataset, setDataset }) => {
  const tabs = dataset === 'bearing' 
    ? ['LIVE', 'SYNTHETIC DATA', 'DATASET DEEP-DIVE']
    : ['LIVE', 'BUSINESS VALUE', 'DATASET DEEP-DIVE'];

  const handleDatasetSwitch = (newDataset) => {
    setDataset(newDataset);
    if (newDataset === 'bearing' && activeTab === 'BUSINESS VALUE') setActiveTab('SYNTHETIC DATA');
    if (newDataset === 'cmapss' && activeTab === 'SYNTHETIC DATA') setActiveTab('BUSINESS VALUE');
  };

  return (
    <div className="nav-container">
      <div className="dataset-switcher-container">
        <div className="dataset-switcher">
          <button 
            className={`switch-btn ${dataset === 'cmapss' ? 'active' : ''}`}
            onClick={() => handleDatasetSwitch('cmapss')}
            title="TURBOFAN ENGINE"
          >
            <span className="switch-dot"></span>
          </button>
          <div className="switch-track"></div>
          <button 
            className={`switch-btn ${dataset === 'bearing' ? 'active' : ''}`}
            onClick={() => handleDatasetSwitch('bearing')}
            title="BEARING"
          >
            <span className="switch-dot"></span>
          </button>
        </div>
      </div>
      <nav className="top-nav">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`nav-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            [ {tab} ]
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Navigation;
