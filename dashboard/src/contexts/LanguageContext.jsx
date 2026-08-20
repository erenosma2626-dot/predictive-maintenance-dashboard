import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import translations from '../data/translations.json';

const LanguageContext = createContext();

// Pre-build flattened lookup dictionaries for O(1) instantaneous access
function flattenTranslations(rawObj) {
  const dictEn = {};
  const dictTr = {};

  function traverse(obj, prefix = '') {
    for (const [k, v] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object') {
        if ('en' in v && 'tr' in v) {
          dictEn[fullKey] = v.en;
          dictTr[fullKey] = v.tr;
        } else {
          traverse(v, fullKey);
        }
      }
    }
  }

  traverse(rawObj);
  return { en: dictEn, tr: dictTr };
}

const FLAT_TRANSLATIONS = flattenTranslations(translations);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // 'en' or 'tr'

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'en' ? 'tr' : 'en'));
  }, []);

  const t = useCallback(
    (key) => {
      const dict = FLAT_TRANSLATIONS[language];
      if (dict && key in dict) {
        return dict[key];
      }
      return key;
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({ language, toggleLanguage, t }),
    [language, toggleLanguage, t]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
