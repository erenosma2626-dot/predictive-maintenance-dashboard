import React from 'react';
import './Navigation.css';

const Navigation = ({ activeTab, setActiveTab }) => {
  const tabs = ['LIVE', 'BUSINESS VALUE', 'DATASET DEEP-DIVE'];

  return (
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
  );
};

export default Navigation;
