import { AppLocale, TranslationParams, supportedLocales } from 'locales/types';

export const DEFAULT_LOCALE: AppLocale = 'en';

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
