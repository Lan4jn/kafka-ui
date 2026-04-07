import {
  DEFAULT_LOCALE,
  detectBrowserLocale,
  interpolateMessage,
  resolveLocale,
} from 'lib/i18n';

describe('i18n utilities', () => {
  describe('detectBrowserLocale', () => {
    const originalLanguage = navigator.language;
    const originalLanguages = navigator.languages;

    afterEach(() => {
      Object.defineProperty(window.navigator, 'language', {
        configurable: true,
        value: originalLanguage,
      });
      Object.defineProperty(window.navigator, 'languages', {
        configurable: true,
        value: originalLanguages,
      });
    });

    it('returns zh-CN for zh browser locales', () => {
      Object.defineProperty(window.navigator, 'language', {
        configurable: true,
        value: 'zh-Hans-CN',
      });

      expect(detectBrowserLocale()).toBe('zh-CN');
    });

    it('normalizes en_US browser locale to en', () => {
      Object.defineProperty(window.navigator, 'language', {
        configurable: true,
        value: 'en_US',
      });

      expect(detectBrowserLocale()).toBe('en');
    });

    it('falls back to en for unsupported locales', () => {
      Object.defineProperty(window.navigator, 'language', {
        configurable: true,
        value: 'fr-FR',
      });

      expect(detectBrowserLocale()).toBe('en');
    });
  });

  describe('resolveLocale', () => {
    it('prefers a saved locale over browser locale', () => {
      expect(resolveLocale('zh-CN', 'en')).toBe('zh-CN');
    });

    it('uses browser locale when there is no saved locale', () => {
      expect(resolveLocale(null, 'zh-CN')).toBe('zh-CN');
    });

    it('normalizes saved en_US locale', () => {
      expect(resolveLocale('en_US', 'zh-CN')).toBe('en');
    });

    it('falls back to default locale when both are unsupported', () => {
      expect(resolveLocale('ja', 'fr')).toBe(DEFAULT_LOCALE);
    });
  });

  describe('interpolateMessage', () => {
    it('replaces named placeholders', () => {
      expect(
        interpolateMessage('{topicName} messages cleared', {
          topicName: 'orders',
        })
      ).toBe('orders messages cleared');
    });
  });
});
