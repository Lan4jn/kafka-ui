import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { zhCN } from 'locales/zh-CN';
import { render as renderWithProviders } from 'lib/testHelpers';
import {
  LocaleProvider,
  useTranslation,
} from 'components/contexts/LocaleContext';

const setNavigatorLanguage = (language: string, languages?: string[]) => {
  Object.defineProperty(window.navigator, 'language', {
    value: language,
    configurable: true,
  });
  Object.defineProperty(window.navigator, 'languages', {
    value: languages ?? [language],
    configurable: true,
  });
};

const TranslationProbe: React.FC<{ k: string }> = ({ k }) => {
  const { t, locale, setLocale } = useTranslation();
  return (
    <div>
      <div data-testid="locale">{locale}</div>
      <div data-testid="msg">{t(k)}</div>
      <button type="button" onClick={() => setLocale('zh-CN')}>
        set-zh
      </button>
    </div>
  );
};

describe('LocaleContext', () => {
  beforeEach(() => {
    localStorage.clear();
    setNavigatorLanguage('en-US', ['en-US']);
    jest.restoreAllMocks();
  });

  test('prefers saved locale from localStorage(locale)', () => {
    localStorage.setItem('locale', 'zh-CN');

    render(
      <LocaleProvider>
        <TranslationProbe k="common.actions.cancel" />
      </LocaleProvider>
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('zh-CN');
    expect(screen.getByTestId('msg')).toHaveTextContent('取消');
  });

  test('falls back to browser language when no saved locale', () => {
    setNavigatorLanguage('zh', ['zh', 'en-US']);

    render(
      <LocaleProvider>
        <TranslationProbe k="common.actions.confirm" />
      </LocaleProvider>
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('zh-CN');
    expect(screen.getByTestId('msg')).toHaveTextContent('确认');
  });

  test('falls back to en when browser language is unsupported', () => {
    setNavigatorLanguage('fr-FR', ['fr-FR']);

    render(
      <LocaleProvider>
        <TranslationProbe k="common.actions.cancel" />
      </LocaleProvider>
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('msg')).toHaveTextContent('Cancel');
  });

  test('uses English as fallback dictionary when current locale is missing a key', () => {
    localStorage.setItem('locale', 'zh-CN');

    const original = zhCN['common.actions.confirm'];
    // Simulate a missing key in current locale at runtime.
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (zhCN as Record<string, string>)['common.actions.confirm'];

    try {
      render(
        <LocaleProvider>
          <TranslationProbe k="common.actions.confirm" />
        </LocaleProvider>
      );

      expect(screen.getByTestId('msg')).toHaveTextContent('Confirm');
    } finally {
      (zhCN as Record<string, string>)['common.actions.confirm'] = original;
    }
  });

  test('warns (in non-production env) when translation key is missing from all dictionaries', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <LocaleProvider>
        <TranslationProbe k="missing.key" />
      </LocaleProvider>
    );

    expect(screen.getByTestId('msg')).toHaveTextContent('missing.key');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test('setLocale updates locale and persists to localStorage', () => {
    localStorage.setItem('locale', 'en');

    render(
      <LocaleProvider>
        <TranslationProbe k="common.actions.cancel" />
      </LocaleProvider>
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('msg')).toHaveTextContent('Cancel');

    fireEvent.click(screen.getByRole('button', { name: 'set-zh' }));

    expect(screen.getByTestId('locale')).toHaveTextContent('zh-CN');
    expect(screen.getByTestId('msg')).toHaveTextContent('取消');
    expect(localStorage.getItem('locale')).toBe('zh-CN');
  });

  test('testHelpers render wraps LocaleProvider (no extra provider nesting needed)', () => {
    localStorage.setItem('locale', 'en');

    renderWithProviders(<TranslationProbe k="common.actions.cancel" />);

    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('msg')).toHaveTextContent('Cancel');
  });

  test('supports nested plan keys like navbar.theme.dark', () => {
    localStorage.setItem('locale', 'zh-CN');

    render(
      <LocaleProvider>
        <TranslationProbe k="navbar.theme.dark" />
      </LocaleProvider>
    );

    expect(screen.getByTestId('msg')).toHaveTextContent('深色');
  });
});
