import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { StorageAdapter } from '../adapters/storage';
import { MobileStringKey, MobileUiLanguage, TRANSLATIONS, resolveUiLanguage } from './translations';

export interface LanguageContextValue {
  /**
   * Currently selected language code (any of the app's languages — drives TTS
   * and API language params). UI text resolution for non-en/te falls back to
   * English until those dictionaries exist.
   */
  lang: string;
  /** Select + persist a language. UI text updates immediately app-wide. */
  setLang: (lang: string) => void;
  /** Translate a UI string key; `{placeholders}` are interpolated via params. */
  t: (key: MobileStringKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const DEFAULT_LANG = 'te';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<string>(DEFAULT_LANG);

  // Restore the persisted language once on launch (survives app restarts).
  useEffect(() => {
    let active = true;
    StorageAdapter.getSelectedLanguage().then((saved) => {
      if (active && typeof saved === 'string' && saved.length === 2) {
        setLangState(saved);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const uiLang: MobileUiLanguage = resolveUiLanguage(lang);
    const strings = TRANSLATIONS[uiLang];

    const t = (key: MobileStringKey, params?: Record<string, string | number>): string => {
      let str = strings[key] ?? TRANSLATIONS.en[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.split(`{${k}}`).join(String(v));
        }
      }
      return str;
    };

    return {
      lang,
      setLang: (next: string) => {
        setLangState(next);
        StorageAdapter.setSelectedLanguage(next);
      },
      t,
    };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}