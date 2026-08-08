import React from 'react';
import './ResourcesPage.css';
import literatureDataEn from '../data/literature_en.json';
import literatureDataTr from '../data/literature_tr.json';
import { useLanguage } from '../contexts/LanguageContext';

const ResourcesPage = () => {
  const { language, t } = useLanguage();
  
  const literatureData = language === 'en' ? literatureDataEn : literatureDataTr;
  const { articles, synthesis } = literatureData;

  return (
    <div className="resources-page fade-in">
      <div className="synthesis-banner">
        <h2 className="synthesis-title">{t('resources.synthesis_title')}</h2>
        <ul className="synthesis-list">
          {synthesis.map((item, idx) => (
            <li key={idx}>
              <strong dangerouslySetInnerHTML={{ __html: item.bold }}></strong>{' '}
              <span dangerouslySetInnerHTML={{ __html: item.text }}></span>
            </li>
          ))}
        </ul>
      </div>

      <div className="articles-grid">
        {articles.map((article) => (
          <div key={article.id} className="article-card">
            <div className="article-header">
              <h3>{article.title}</h3>
              {article.source && <p className="article-source" dangerouslySetInnerHTML={{ __html: article.source }}></p>}
            </div>
            
            <div className="article-body">
              {article.proposes && (
                <div className="article-section">
                  <span className="section-label">{t('resources.proposes')}</span>
                  <p dangerouslySetInnerHTML={{ __html: article.proposes }}></p>
                </div>
              )}
              
              {article.takeaway && (
                <div className="article-section takeaway-section">
                  <span className="section-label text-accent">{t('resources.takeaway')}</span>
                  <p dangerouslySetInnerHTML={{ __html: article.takeaway }}></p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourcesPage;
