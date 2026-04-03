export const supportedLocales = ['en', 'zh-CN'] as const;

export type AppLocale = (typeof supportedLocales)[number];

export type TranslationParams = Record<string, string | number>;
