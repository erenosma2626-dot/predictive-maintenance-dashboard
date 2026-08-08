import React from 'react';
import './BusinessValuePage.css';
import { useLanguage } from '../contexts/LanguageContext';

const BusinessValuePage = ({ dataset }) => {
  const { t } = useLanguage();
  if (dataset === 'bearing') {
    return (
      <div className="bv-page fade-in">
        <div className="panel placeholder-panel">
          <div className="placeholder-content">
            <span className="section-label" style={{textAlign: 'center', display: 'block', marginBottom: '1rem'}}>{t('business.coming_soon')}</span>
            <p className="placeholder-text">
              {t('business.placeholder_text')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bv-page fade-in">
      <div className="panel chart-panel">
        <span className="section-label">{t('business.expected_value')}</span>
        
        <div className="bar-chart-container">
          <div className="chart-bars">
            {/* Reactive */}
            <div className="bar-group">
              <div className="bar reactive" style={{ height: '5%' }}>
                <span className="bar-label">$0</span>
              </div>
              <span className="bar-title">{t('business.reactive')}</span>
            </div>
            
            {/* Preventive */}
            <div className="bar-group">
              <div className="bar preventive" style={{ height: '75%' }}>
                <span className="bar-label">+$1.66M</span>
              </div>
              <span className="bar-title">{t('business.preventive')}</span>
            </div>

            {/* Model */}
            <div className="bar-group">
              <div className="bar model" style={{ height: '90%' }}>
                <span className="bar-label text-accent">+$1.94M</span>
              </div>
              <span className="bar-title text-accent">{t('business.model')}</span>
            </div>
          </div>
        </div>

        <div className="sensitivity-note">
          {t('business.sensitivity')}
        </div>
      </div>

      <div className="panel methodology-panel">
        <span className="section-label">{t('business.methodology')}</span>
        <div className="methodology-content">
          <p>
            {t('business.meth_desc')}
          </p>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: t('business.tp_cost') }}></li>
            <li dangerouslySetInnerHTML={{ __html: t('business.fp_cost') }}></li>
            <li dangerouslySetInnerHTML={{ __html: t('business.fn_cost') }}></li>
            <li dangerouslySetInnerHTML={{ __html: t('business.tn_cost') }}></li>
          </ul>
          <p className="mt-1">
            <strong>{t('business.sources')}</strong><br/>
            {t('business.source_1')}<br/>
            {t('business.source_2')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessValuePage;
