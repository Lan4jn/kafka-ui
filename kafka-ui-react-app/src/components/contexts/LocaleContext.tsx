import React from 'react';
import type { PropsWithChildren } from 'react';
import type { AppLocale, TranslationParams } from 'locales/types';
import {
  detectBrowserLocale,
  normalizeLocale,
  translateMessage,
} from 'lib/i18n';

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
    (key: string, params?: TranslationParams): string =>
      translateMessage(key, params, locale),
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
