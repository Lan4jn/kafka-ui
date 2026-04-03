import React from 'react';
import type { PropsWithChildren } from 'react';

import type { AppLocale, TranslationParams } from 'locales/types';
import { en } from 'locales/en';
import { zhCN } from 'locales/zh-CN';
import {
  detectBrowserLocale,
  interpolateMessage,
  normalizeLocale,
} from 'lib/i18n';

type TranslationDict = Record<string, string>;

const dictionaries: Record<AppLocale, TranslationDict> = {
  en,
  'zh-CN': zhCN,
};

export interface LocaleContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: string, params?: TranslationParams) => string;
}

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

const getInitialLocale = (): AppLocale => {
  const saved = normalizeLocale(localStorage.getItem('locale'));
  if (saved) return saved;
  return detectBrowserLocale();
};

export const LocaleProvider: React.FC<PropsWithChildren<unknown>> = ({
  children,
}) => {
  const [locale, setLocaleState] = React.useState<AppLocale>(getInitialLocale);

  const setLocale = React.useCallback((next: AppLocale) => {
    setLocaleState(next);
    localStorage.setItem('locale', next);
  }, []);

  const t = React.useCallback(
    (key: string, params?: TranslationParams): string => {
      const message =
        dictionaries[locale]?.[key] ?? dictionaries.en[key];

      if (typeof message === 'string') {
        return interpolateMessage(message, params);
      }

      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[i18n] Missing translation key: "${key}"`);
      }

      return key;
    },
    [locale]
  );

  const value = React.useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
};

export const useTranslation = (): LocaleContextValue => {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within LocaleProvider');
  }
  return ctx;
};

