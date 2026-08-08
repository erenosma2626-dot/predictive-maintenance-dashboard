import React from 'react';
import './Navigation.css';
import { useLanguage } from '../contexts/LanguageContext';

const Navigation = ({ activeTab, setActiveTab, dataset, setDataset }) => {
  const { language, toggleLanguage, t } = useLanguage();

  const baseTabs = dataset === 'bearing' 
    ? ['live', 'synthetic', 'deepdive', 'resources']
    : ['live', 'business', 'deepdive', 'resources'];

  const tabMapping = {
    'live': 'LIVE',
    'synthetic': 'SYNTHETIC DATA',
    'business': 'BUSINESS VALUE',
    'deepdive': 'DATASET DEEP-DIVE',
    'resources': 'RESOURCES'
  };

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
            className={`switch-btn left-btn ${dataset === 'cmapss' ? 'active' : ''}`}
            onClick={() => handleDatasetSwitch('cmapss')}
            title="TURBOFAN ENGINE"
          >
            <span className="switch-dot"></span>
            <span className="switch-label">JET ENGINE</span>
          </button>
          <div className="switch-track"></div>
          <button 
            className={`switch-btn right-btn ${dataset === 'bearing' ? 'active' : ''}`}
            onClick={() => handleDatasetSwitch('bearing')}
            title="BEARING"
          >
            <span className="switch-label">BEARING</span>
            <span className="switch-dot"></span>
          </button>
        </div>
      </div>
      <nav className="top-nav">
        {baseTabs.map((tabKey) => (
          <button
            key={tabKey}
            className={`nav-btn ${activeTab === tabMapping[tabKey] ? 'active' : ''}`}
            onClick={() => setActiveTab(tabMapping[tabKey])}
          >
            [ {t(`nav.${tabKey}`)} ]
          </button>
        ))}
      </nav>
      <button 
        className="lang-toggle-btn fade-in"
        onClick={toggleLanguage}
        title="Toggle Language"
      >
        {language === 'en' ? 'EN | TR' : 'TR | EN'}
      </button>
    </div>
  );
};

export default Navigation;
