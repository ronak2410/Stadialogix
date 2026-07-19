'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations, LanguageCode } from './translations';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: keyof typeof translations['en-US']) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>('en-US');

  const t = (key: keyof typeof translations['en-US']): string => {
    return translations[language][key] || translations['en-US'][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
