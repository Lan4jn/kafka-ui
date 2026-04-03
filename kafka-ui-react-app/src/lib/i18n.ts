import { en } from 'locales/en';
import { zhCN } from 'locales/zh-CN';
import { AppLocale, TranslationParams, supportedLocales } from 'locales/types';

export const DEFAULT_LOCALE: AppLocale = 'en';
export const translationDictionaries: Record<AppLocale, Record<string, string>> =
  {
    en,
    'zh-CN': zhCN,
  };

const zhLocalePattern = /^zh($|-|_)/i;

export const normalizeLocale = (
  locale?: string | null
): AppLocale | null => {
  if (!locale) return null;

  const lowered = locale.toLowerCase();

  if (zhLocalePattern.test(lowered)) return 'zh-CN';
  if (lowered === 'en') return 'en';
  if (lowered.startsWith('en-') || lowered.startsWith('en_')) return 'en';

  return null;
};

export const detectBrowserLocale = (): AppLocale => {
  const candidateLocales = [navigator.language, ...(navigator.languages ?? [])];

  for (const candidate of candidateLocales) {
    const normalized = normalizeLocale(candidate);
    if (normalized) return normalized;
  }

  return DEFAULT_LOCALE;
};

export const resolveLocale = (
  savedLocale?: string | null,
  browserLocale?: string | null
): AppLocale =>
  normalizeLocale(savedLocale) ||
  normalizeLocale(browserLocale) ||
  DEFAULT_LOCALE;

export const interpolateMessage = (
  message: string,
  params?: TranslationParams
): string => {
  if (!params) return message;

  return Object.entries(params).reduce((formatted, [key, value]) => {
    const placeholder = '{' + key + '}';
    return formatted.replaceAll(placeholder, String(value));
  }, message);
};

export const isSupportedLocale = (locale: string): locale is AppLocale =>
  supportedLocales.includes(locale as AppLocale);

export const translateMessage = (
  key: string,
  params?: TranslationParams,
  locale: AppLocale = DEFAULT_LOCALE
): string => {
  const message =
    translationDictionaries[locale]?.[key] ??
    translationDictionaries[DEFAULT_LOCALE][key];

  if (typeof message === 'string') {
    return interpolateMessage(message, params);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[i18n] Missing translation key: "${key}"`);
  }

  return key;
};

export const getCurrentLocale = (): AppLocale => {
  const savedLocale =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('locale')
      : null;
  const browserLocale =
    typeof navigator !== 'undefined' ? navigator.language : null;

  return resolveLocale(savedLocale, browserLocale);
};
