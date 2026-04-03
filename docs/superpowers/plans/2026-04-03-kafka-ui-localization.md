# Kafka UI Frontend Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add browser-detected, user-switchable English and Simplified Chinese localization to the React app, covering frontend UI copy and frontend-generated notifications.

**Architecture:** Introduce a lightweight locale context plus dictionary-based translation layer, wire it into the app root, expose a locale switcher in the top navigation, and migrate hardcoded strings in staged batches. English remains the fallback dictionary, while `localStorage` preserves explicit user choice over browser defaults.

**Tech Stack:** React, TypeScript, Jest, React Testing Library, existing custom `Select` component, existing context/provider patterns

---

## File Map

### Create

- `kafka-ui-react-app/src/components/contexts/LocaleContext.tsx`
- `kafka-ui-react-app/src/components/contexts/__tests__/LocaleContext.spec.tsx`
- `kafka-ui-react-app/src/locales/en.ts`
- `kafka-ui-react-app/src/locales/zh-CN.ts`
- `kafka-ui-react-app/src/locales/types.ts`
- `kafka-ui-react-app/src/lib/i18n.ts`
- `kafka-ui-react-app/src/lib/__test__/i18n.spec.ts`

### Modify

- `kafka-ui-react-app/src/index.tsx`
- `kafka-ui-react-app/src/lib/testHelpers.tsx`
- `kafka-ui-react-app/src/components/NavBar/NavBar.tsx`
- `kafka-ui-react-app/src/components/Nav/Nav.tsx`
- `kafka-ui-react-app/src/components/common/ConfirmationModal/ConfirmationModal.tsx`
- `kafka-ui-react-app/src/components/App.tsx`
- `kafka-ui-react-app/src/components/__tests__/App.spec.tsx`
- `kafka-ui-react-app/src/lib/hooks/api/topics.ts`
- `kafka-ui-react-app/src/components/Topics/List/ActionsCell.tsx`
- `kafka-ui-react-app/src/components/Topics/List/BatchActionsBar.tsx`
- `kafka-ui-react-app/src/components/Topics/Topic/Topic.tsx`

### Likely Follow-Up Modify Set For Phase 2

- `kafka-ui-react-app/src/components/Topics/**`
- `kafka-ui-react-app/src/components/ConsumerGroups/**`
- `kafka-ui-react-app/src/components/Brokers/**`
- `kafka-ui-react-app/src/components/Schemas/**`
- `kafka-ui-react-app/src/components/Connect/**`
- `kafka-ui-react-app/src/components/KsqlDb/**`

## Task 1: Build Locale Utilities With Tests First

**Files:**

- Create: `kafka-ui-react-app/src/lib/i18n.ts`
- Create: `kafka-ui-react-app/src/lib/__test__/i18n.spec.ts`
- Create: `kafka-ui-react-app/src/locales/types.ts`

- [ ] **Step 1: Write the failing utility tests**

```ts
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
```

- [ ] **Step 2: Run the utility tests to verify failure**

Run: `pnpm test -- --runInBand src/lib/__test__/i18n.spec.ts`

Expected: FAIL with module-not-found or missing export errors for `lib/i18n`.

- [ ] **Step 3: Add locale types and minimal utility implementation**

```ts
// kafka-ui-react-app/src/locales/types.ts
export const supportedLocales = ['en', 'zh-CN'] as const;

export type AppLocale = (typeof supportedLocales)[number];

export type TranslationParams = Record<string, string | number>;
```

```ts
// kafka-ui-react-app/src/lib/i18n.ts
import { AppLocale, TranslationParams, supportedLocales } from 'locales/types';

export const DEFAULT_LOCALE: AppLocale = 'en';

const zhLocalePattern = /^zh($|-|_)/i;

export const normalizeLocale = (locale?: string | null): AppLocale | null => {
  if (!locale) return null;
  if (zhLocalePattern.test(locale)) return 'zh-CN';
  if (locale.toLowerCase() === 'en') return 'en';
  if (locale.toLowerCase().startsWith('en-')) return 'en';
  return null;
};

export const detectBrowserLocale = (): AppLocale => {
  const browserLocale =
    navigator.languages?.find(Boolean) || navigator.language || DEFAULT_LOCALE;

  return normalizeLocale(browserLocale) || DEFAULT_LOCALE;
};

export const resolveLocale = (
  savedLocale?: string | null,
  browserLocale?: string | null
): AppLocale => {
  return (
    normalizeLocale(savedLocale) ||
    normalizeLocale(browserLocale) ||
    DEFAULT_LOCALE
  );
};

export const interpolateMessage = (
  message: string,
  params?: TranslationParams
): string => {
  if (!params) return message;

  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, message);
};

export const isSupportedLocale = (locale: string): locale is AppLocale =>
  supportedLocales.includes(locale as AppLocale);
```

- [ ] **Step 4: Re-run utility tests**

Run: `pnpm test -- --runInBand src/lib/__test__/i18n.spec.ts`

Expected: PASS for locale normalization and interpolation tests.

- [ ] **Step 5: Commit the utility layer**

```bash
git add kafka-ui-react-app/src/lib/i18n.ts \
  kafka-ui-react-app/src/lib/__test__/i18n.spec.ts \
  kafka-ui-react-app/src/locales/types.ts
git commit -m "feat: add locale utility primitives"
```

## Task 2: Add Locale Dictionaries And Provider

**Files:**

- Create: `kafka-ui-react-app/src/locales/en.ts`
- Create: `kafka-ui-react-app/src/locales/zh-CN.ts`
- Create: `kafka-ui-react-app/src/components/contexts/LocaleContext.tsx`
- Create: `kafka-ui-react-app/src/components/contexts/__tests__/LocaleContext.spec.tsx`
- Modify: `kafka-ui-react-app/src/index.tsx`
- Modify: `kafka-ui-react-app/src/lib/testHelpers.tsx`

- [ ] **Step 1: Write the failing provider tests**

```tsx
import React from 'react';
import { screen } from '@testing-library/react';
import { render } from 'lib/testHelpers';
import {
  LocaleProvider,
  useTranslation,
} from 'components/contexts/LocaleContext';

const TestComponent = () => {
  const { locale, setLocale, t } = useTranslation();

  return (
    <>
      <div>{locale}</div>
      <button onClick={() => setLocale('en')}>{t('common.actions.cancel')}</button>
      <span>{t('navbar.language')}</span>
    </>
  );
};

describe('LocaleContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('uses browser Chinese locale by default', () => {
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      value: 'zh-CN',
    });

    render(
      <LocaleProvider>
        <TestComponent />
      </LocaleProvider>
    );

    expect(screen.getByText('zh-CN')).toBeInTheDocument();
    expect(screen.getByText('语言')).toBeInTheDocument();
  });

  it('persists explicit locale changes', () => {
    render(
      <LocaleProvider>
        <TestComponent />
      </LocaleProvider>
    );

    screen.getByRole('button', { name: 'Cancel' }).click();

    expect(localStorage.getItem('locale')).toBe('en');
  });
});
```

- [ ] **Step 2: Run provider tests to verify failure**

Run: `pnpm test -- --runInBand src/components/contexts/__tests__/LocaleContext.spec.tsx`

Expected: FAIL with missing provider or translation dictionary errors.

- [ ] **Step 3: Add dictionaries and locale context**

```ts
// kafka-ui-react-app/src/locales/en.ts
const en = {
  common: {
    actions: {
      cancel: 'Cancel',
      confirm: 'Confirm',
    },
  },
  navbar: {
    language: 'Language',
    locale: {
      en: 'English',
      'zh-CN': '简体中文',
    },
    theme: {
      auto: 'Auto theme',
      light: 'Light theme',
      dark: 'Dark theme',
    },
    title: 'UI for Apache Kafka',
  },
  nav: {
    dashboard: 'Dashboard',
  },
  confirmation: {
    title: 'Confirm the action',
  },
  errors: {
    accessDenied: 'Access is Denied',
  },
} as const;

export default en;
```

```ts
// kafka-ui-react-app/src/locales/zh-CN.ts
const zhCN = {
  common: {
    actions: {
      cancel: '取消',
      confirm: '确认',
    },
  },
  navbar: {
    language: '语言',
    locale: {
      en: 'English',
      'zh-CN': '简体中文',
    },
    theme: {
      auto: '跟随系统',
      light: '浅色主题',
      dark: '深色主题',
    },
    title: 'Apache Kafka 管理界面',
  },
  nav: {
    dashboard: '仪表盘',
  },
  confirmation: {
    title: '确认操作',
  },
  errors: {
    accessDenied: '没有访问权限',
  },
} as const;

export default zhCN;
```

```tsx
// kafka-ui-react-app/src/components/contexts/LocaleContext.tsx
import React, { FC, PropsWithChildren, useMemo } from 'react';
import en from 'locales/en';
import zhCN from 'locales/zh-CN';
import { AppLocale, TranslationParams } from 'locales/types';
import {
  DEFAULT_LOCALE,
  detectBrowserLocale,
  interpolateMessage,
  resolveLocale,
} from 'lib/i18n';

const STORAGE_KEY = 'locale';
const dictionaries = {
  en,
  'zh-CN': zhCN,
} as const;

type Dictionary = typeof en;

const getValue = (dictionary: Dictionary, key: string): string | undefined => {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dictionary) as string | undefined;
};

interface LocaleContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: string, params?: TranslationParams) => string;
}

const LocaleContext = React.createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
});

export const LocaleProvider: FC<PropsWithChildren<unknown>> = ({ children }) => {
  const [locale, setLocaleState] = React.useState<AppLocale>(() =>
    resolveLocale(localStorage.getItem(STORAGE_KEY), detectBrowserLocale())
  );

  const setLocale = React.useCallback((nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
    localStorage.setItem(STORAGE_KEY, nextLocale);
  }, []);

  const t = React.useCallback(
    (key: string, params?: TranslationParams) => {
      const localized =
        getValue(dictionaries[locale], key) ?? getValue(dictionaries.en, key);

      if (!localized) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn(`Missing translation key: ${key}`);
        }
        return key;
      }

      return interpolateMessage(localized, params);
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useTranslation = () => React.useContext(LocaleContext);
```

- [ ] **Step 4: Wire the provider into runtime and tests**

```tsx
// kafka-ui-react-app/src/index.tsx
import { LocaleProvider } from 'components/contexts/LocaleContext';

root.render(
  <Provider store={store}>
    <BrowserRouter basename={window.basePath || '/'}>
      <LocaleProvider>
        <ThemeModeProvider>
          <App />
        </ThemeModeProvider>
      </LocaleProvider>
    </BrowserRouter>
  </Provider>
);
```

```tsx
// kafka-ui-react-app/src/lib/testHelpers.tsx
import { LocaleProvider } from 'components/contexts/LocaleContext';

const AllTheProviders: React.FC<PropsWithChildren<unknown>> = ({ children }) => (
  <TestQueryClientProvider>
    <GlobalSettingsContext.Provider
      value={globalSettings || { hasDynamicConfig: false }}
    >
      <ThemeProvider theme={theme}>
        <TestUserInfoProvider data={userInfo}>
          <ConfirmContextProvider>
            <Provider store={store}>
              <MemoryRouter initialEntries={initialEntries}>
                <LocaleProvider>
                  <div>
                    {children}
                    <ConfirmationModal />
                  </div>
                </LocaleProvider>
              </MemoryRouter>
            </Provider>
          </ConfirmContextProvider>
        </TestUserInfoProvider>
      </ThemeProvider>
    </GlobalSettingsContext.Provider>
  </TestQueryClientProvider>
);
```

- [ ] **Step 5: Run provider tests**

Run: `pnpm test -- --runInBand src/components/contexts/__tests__/LocaleContext.spec.tsx`

Expected: PASS for browser default and persistence behavior.

- [ ] **Step 6: Commit provider and resource scaffolding**

```bash
git add kafka-ui-react-app/src/components/contexts/LocaleContext.tsx \
  kafka-ui-react-app/src/components/contexts/__tests__/LocaleContext.spec.tsx \
  kafka-ui-react-app/src/locales/en.ts \
  kafka-ui-react-app/src/locales/zh-CN.ts \
  kafka-ui-react-app/src/index.tsx \
  kafka-ui-react-app/src/lib/testHelpers.tsx
git commit -m "feat: add locale provider and dictionaries"
```

## Task 3: Add The Navigation Locale Switcher And Localize Shared Shell Copy

**Files:**

- Modify: `kafka-ui-react-app/src/components/NavBar/NavBar.tsx`
- Modify: `kafka-ui-react-app/src/components/Nav/Nav.tsx`
- Modify: `kafka-ui-react-app/src/components/common/ConfirmationModal/ConfirmationModal.tsx`
- Modify: `kafka-ui-react-app/src/components/App.tsx`
- Modify: `kafka-ui-react-app/src/components/__tests__/App.spec.tsx`

- [ ] **Step 1: Write failing shell-level tests**

```tsx
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import App from 'components/App';
import { render } from 'lib/testHelpers';

jest.mock('components/Nav/Nav', () => () => <div>Dashboard</div>);
jest.mock('components/Version/Version', () => () => <div>Version</div>);
jest.mock('lib/hooks/api/roles', () => ({
  useGetUserInfo: jest.fn(() => ({ data: {} })),
}));
jest.mock('lib/hooks/api/appConfig', () => ({
  useAppInfo: jest.fn(() => ({ data: {} })),
}));

describe('App localization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders Chinese shell copy when browser locale is Chinese', () => {
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      value: 'zh-CN',
    });

    render(<App />, { initialEntries: ['/'] });

    expect(screen.getByText('语言')).toBeInTheDocument();
  });

  it('persists a language selection from the navbar', async () => {
    render(<App />, { initialEntries: ['/'] });

    fireEvent.click(screen.getByText('Language'));
    fireEvent.click(screen.getByText('简体中文'));

    expect(localStorage.getItem('locale')).toBe('zh-CN');
  });
});
```

- [ ] **Step 2: Run shell tests to verify failure**

Run: `pnpm test -- --runInBand src/components/__tests__/App.spec.tsx`

Expected: FAIL because the navigation does not expose locale text or locale switching yet.

- [ ] **Step 3: Implement localized shell components**

```tsx
// kafka-ui-react-app/src/components/NavBar/NavBar.tsx
import { useTranslation } from 'components/contexts/LocaleContext';

export type ThemeDropDownValue = 'auto_theme' | 'light_theme' | 'dark_theme';

const NavBar: React.FC<Props> = ({ onBurgerClick }) => {
  const { themeMode, setThemeMode } = useContext(ThemeModeContext);
  const { locale, setLocale, t } = useTranslation();

  const localeOptions = [
    { label: 'English', value: 'en' },
    { label: '简体中文', value: 'zh-CN' },
  ];

  const options = [
    {
      label: (
        <>
          <AutoIcon />
          <div>{t('navbar.theme.auto')}</div>
        </>
      ),
      value: 'auto_theme',
    },
    {
      label: (
        <>
          <SunIcon />
          <div>{t('navbar.theme.light')}</div>
        </>
      ),
      value: 'light_theme',
    },
    {
      label: (
        <>
          <MoonIcon />
          <div>{t('navbar.theme.dark')}</div>
        </>
      ),
      value: 'dark_theme',
    },
  ];

  return (
    <S.Navbar role="navigation" aria-label="Page Header">
      <S.NavbarBrand>
        <S.NavbarBrand>
          <S.NavbarBurger
            onClick={onBurgerClick}
            onKeyDown={onBurgerClick}
            role="button"
            tabIndex={0}
            aria-label="burger"
          >
            <S.Span role="separator" />
            <S.Span role="separator" />
            <S.Span role="separator" />
          </S.NavbarBurger>

          <S.Hyperlink to="/">
            <Logo />
            {t('navbar.title')}
          </S.Hyperlink>

          <S.NavbarItem>
            <Version />
          </S.NavbarItem>
        </S.NavbarBrand>
      </S.NavbarBrand>
      <S.NavbarSocial>
        <Select options={localeOptions} value={locale} onChange={(value) => setLocale(value as 'en' | 'zh-CN')} />
        <Select options={options} value={themeMode} onChange={setThemeMode} isThemeMode />
        <S.SocialLink href="https://github.com/provectus/kafka-ui" target="_blank">
          <GitIcon />
        </S.SocialLink>
        <S.SocialLink href="https://discord.com/invite/4DWzD7pGE5" target="_blank">
          <DiscordIcon />
        </S.SocialLink>
        <UserInfo />
      </S.NavbarSocial>
    </S.Navbar>
  );
};
```

```tsx
// kafka-ui-react-app/src/components/Nav/Nav.tsx
import { useTranslation } from 'components/contexts/LocaleContext';

const Nav: React.FC = () => {
  const clusters = useClusters();
  const { t } = useTranslation();

  return (
    <aside aria-label="Sidebar Menu">
      <S.List>
        <ClusterMenuItem to="/" title={t('nav.dashboard')} isTopLevel />
      </S.List>
      {clusters.isSuccess &&
        clusters.data.map((cluster) => (
          <ClusterMenu
            cluster={cluster}
            key={cluster.name}
            singleMode={clusters.data.length === 1}
          />
        ))}
    </aside>
  );
};
```

```tsx
// kafka-ui-react-app/src/components/common/ConfirmationModal/ConfirmationModal.tsx
import { useTranslation } from 'components/contexts/LocaleContext';

const ConfirmationModal: React.FC = () => {
  const context = React.useContext(ConfirmContext);
  const { t } = useTranslation();
  const isOpen = context?.content && context?.confirm;

  if (!isOpen) return null;

  return (
    <S.Wrapper role="dialog" aria-label="Confirmation Dialog">
      <S.Overlay onClick={context.cancel} aria-hidden="true" role="button" />
      <S.Modal>
        <S.Header>{t('confirmation.title')}</S.Header>
        <S.Content>{context.content}</S.Content>
        <S.Footer>
          <Button buttonType="secondary" buttonSize="M" onClick={context.cancel} type="button">
            {t('common.actions.cancel')}
          </Button>
          <Button buttonType={context.dangerButton ? 'danger' : 'primary'} buttonSize="M" onClick={context.confirm} type="button">
            {t('common.actions.confirm')}
          </Button>
        </S.Footer>
      </S.Modal>
    </S.Wrapper>
  );
};
```

```tsx
// kafka-ui-react-app/src/components/App.tsx
import { useTranslation } from 'components/contexts/LocaleContext';

const App: React.FC = () => {
  const { isDarkMode } = useContext(ThemeModeContext);
  const { t } = useTranslation();

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalSettingsProvider>
        <ThemeProvider theme={isDarkMode ? darkTheme : theme}>
          <Suspense fallback={<PageLoader />}>
            <UserInfoRolesAccessProvider>
              <ConfirmContextProvider>
                <GlobalCSS />
                <S.Layout>
                  <PageContainer>
                    <Routes>
                      {/* existing route list unchanged */}
                      <Route
                        path={accessErrorPage}
                        element={<ErrorPage status={403} text={t('errors.accessDenied')} />}
                      />
                    </Routes>
                  </PageContainer>
                  <Toaster position="bottom-right" />
                </S.Layout>
                <ConfirmationModal />
              </ConfirmContextProvider>
            </UserInfoRolesAccessProvider>
          </Suspense>
        </ThemeProvider>
      </GlobalSettingsProvider>
    </QueryClientProvider>
  );
};
```

- [ ] **Step 4: Run shell tests**

Run: `pnpm test -- --runInBand src/components/__tests__/App.spec.tsx`

Expected: PASS, with navbar locale selection updating persisted locale.

- [ ] **Step 5: Commit shell localization**

```bash
git add kafka-ui-react-app/src/components/NavBar/NavBar.tsx \
  kafka-ui-react-app/src/components/Nav/Nav.tsx \
  kafka-ui-react-app/src/components/common/ConfirmationModal/ConfirmationModal.tsx \
  kafka-ui-react-app/src/components/App.tsx \
  kafka-ui-react-app/src/components/__tests__/App.spec.tsx
git commit -m "feat: localize app shell and navigation"
```

## Task 4: Localize Frontend-Generated Topic Notifications And Confirmation Flows

**Files:**

- Modify: `kafka-ui-react-app/src/locales/en.ts`
- Modify: `kafka-ui-react-app/src/locales/zh-CN.ts`
- Modify: `kafka-ui-react-app/src/lib/hooks/api/topics.ts`
- Modify: `kafka-ui-react-app/src/components/Topics/List/ActionsCell.tsx`
- Modify: `kafka-ui-react-app/src/components/Topics/List/BatchActionsBar.tsx`
- Modify: `kafka-ui-react-app/src/components/Topics/Topic/Topic.tsx`
- Modify: `kafka-ui-react-app/src/lib/hooks/api/__tests__/topics.spec.ts`

- [ ] **Step 1: Write failing topic notification tests**

```ts
it('returns localized clear message text from the topic hook', async () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <LocaleProvider>{children}</LocaleProvider>
  );

  localStorage.setItem('locale', 'zh-CN');

  const { result } = renderHook(() => useClearTopicMessages(), { wrapper });

  // invoke mutation with topicName: orders
  // assert toast payload contains Chinese translation after success
});
```

```tsx
it('shows localized clear confirmation text', async () => {
  render(<Topic />, {
    initialEntries: ['/clusters/local/topics/orders/messages'],
  });

  expect(screen.getByText('确定要清空该 Topic 的消息吗？')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run targeted topic tests to verify failure**

Run: `pnpm test -- --runInBand src/lib/hooks/api/__tests__/topics.spec.ts src/components/Topics/Topic/__test__/Topic.spec.tsx src/components/Topics/List/__tests__/TopicTable.spec.tsx`

Expected: FAIL because topic notifications and confirmation copy are still hardcoded in English.

- [ ] **Step 3: Add topic-specific locale keys and wire them into the UI**

```ts
// kafka-ui-react-app/src/locales/en.ts
topics: {
  actions: {
    clearMessages: 'Clear messages',
    purgeSelected: 'Purge messages of selected topics',
  },
  confirmations: {
    clearMessages: 'Are you sure want to clear topic messages?',
    purgeSelected: 'Are you sure you want to purge messages of selected topics?',
  },
  notifications: {
    clearSuccess: '{topicName} messages have been successfully cleared!',
  },
},
```

```ts
// kafka-ui-react-app/src/locales/zh-CN.ts
topics: {
  actions: {
    clearMessages: '清空消息',
    purgeSelected: '清空所选 Topic 的消息',
  },
  confirmations: {
    clearMessages: '确定要清空该 Topic 的消息吗？',
    purgeSelected: '确定要清空所选 Topic 的消息吗？',
  },
  notifications: {
    clearSuccess: '{topicName} 的消息已清空',
  },
},
```

```ts
// kafka-ui-react-app/src/lib/hooks/api/topics.ts
import { useTranslation } from 'components/contexts/LocaleContext';

export const useClearTopicMessages = () => {
  const { t } = useTranslation();

  return useMutation(
    async ({ clusterName, topicName }: ClearTopicMessagesParams) => {
      await messagesApiClient.deleteTopicMessages({ clusterName, topicName });
    },
    {
      onSuccess: (_, { topicName }) => {
        toast.success(
          t('topics.notifications.clearSuccess', {
            topicName,
          })
        );
      },
    }
  );
};
```

```tsx
// kafka-ui-react-app/src/components/Topics/List/ActionsCell.tsx
const { t } = useTranslation();

confirm={t('topics.confirmations.clearMessages')}
...
{t('topics.actions.clearMessages')}
```

```tsx
// kafka-ui-react-app/src/components/Topics/List/BatchActionsBar.tsx
const { t } = useTranslation();

const confirmed = await confirm(
  t('topics.confirmations.purgeSelected'),
  undefined,
  true
);

...
{t('topics.actions.purgeSelected')}
```

```tsx
// kafka-ui-react-app/src/components/Topics/Topic/Topic.tsx
const { t } = useTranslation();

confirm={t('topics.confirmations.clearMessages')}
...
{t('topics.actions.clearMessages')}
```

- [ ] **Step 4: Run topic tests**

Run: `pnpm test -- --runInBand src/lib/hooks/api/__tests__/topics.spec.ts src/components/Topics/Topic/__test__/Topic.spec.tsx src/components/Topics/List/__tests__/TopicTable.spec.tsx`

Expected: PASS with localized confirmations and success notifications.

- [ ] **Step 5: Commit topic notification localization**

```bash
git add kafka-ui-react-app/src/locales/en.ts \
  kafka-ui-react-app/src/locales/zh-CN.ts \
  kafka-ui-react-app/src/lib/hooks/api/topics.ts \
  kafka-ui-react-app/src/components/Topics/List/ActionsCell.tsx \
  kafka-ui-react-app/src/components/Topics/List/BatchActionsBar.tsx \
  kafka-ui-react-app/src/components/Topics/Topic/Topic.tsx \
  kafka-ui-react-app/src/lib/hooks/api/__tests__/topics.spec.ts
git commit -m "feat: localize topic notifications and confirmations"
```

## Task 5: Sweep Core Pages For Remaining Hardcoded Strings

**Files:**

- Modify: `kafka-ui-react-app/src/locales/en.ts`
- Modify: `kafka-ui-react-app/src/locales/zh-CN.ts`
- Modify: core page files under:
  - `kafka-ui-react-app/src/components/Topics/**`
  - `kafka-ui-react-app/src/components/ConsumerGroups/**`
  - `kafka-ui-react-app/src/components/Brokers/**`
  - `kafka-ui-react-app/src/components/Schemas/**`
  - `kafka-ui-react-app/src/components/Connect/**`
  - `kafka-ui-react-app/src/components/KsqlDb/**`

- [ ] **Step 1: Generate the migration checklist from hardcoded strings**

Run: `rg -n "\"[A-Za-z][^\"]+\"|>[A-Za-z][^<]+<" kafka-ui-react-app/src/components/{Topics,ConsumerGroups,Brokers,Schemas,Connect,KsqlDb} -g '!**/__test__/**'`

Expected: A file-by-file list of hardcoded UI strings to migrate into the locale dictionaries.

- [ ] **Step 2: Add page-domain dictionaries before touching components**

```ts
// kafka-ui-react-app/src/locales/en.ts
consumerGroups: {
  title: 'Consumer Groups',
},
brokers: {
  title: 'Brokers',
},
schemas: {
  title: 'Schemas',
},
connect: {
  title: 'Kafka Connect',
},
ksqlDb: {
  title: 'KSQL DB',
},
```

```ts
// kafka-ui-react-app/src/locales/zh-CN.ts
consumerGroups: {
  title: '消费者组',
},
brokers: {
  title: 'Broker',
},
schemas: {
  title: 'Schema',
},
connect: {
  title: 'Kafka Connect',
},
ksqlDb: {
  title: 'KSQL DB',
},
```

- [ ] **Step 3: Migrate one page family at a time under TDD**

For each page family:

```tsx
const { t } = useTranslation();

<PageHeading>{t('schemas.title')}</PageHeading>
```

Use this loop per file batch:

1. add or update the failing component test for translated copy
2. run the focused test file
3. replace hardcoded strings with `t(...)`
4. re-run the focused test file

Start with this order:

1. `Topics`
2. `ConsumerGroups`
3. `Brokers`
4. `Schemas`
5. `Connect`
6. `KsqlDb`

- [ ] **Step 4: Run the relevant page test suites**

Run: `pnpm test -- --runInBand src/components/Topics src/components/ConsumerGroups src/components/Brokers src/components/Schemas src/components/Connect src/components/KsqlDb`

Expected: PASS across the migrated page families.

- [ ] **Step 5: Commit the core-page localization sweep**

```bash
git add kafka-ui-react-app/src/locales/en.ts \
  kafka-ui-react-app/src/locales/zh-CN.ts \
  kafka-ui-react-app/src/components/Topics \
  kafka-ui-react-app/src/components/ConsumerGroups \
  kafka-ui-react-app/src/components/Brokers \
  kafka-ui-react-app/src/components/Schemas \
  kafka-ui-react-app/src/components/Connect \
  kafka-ui-react-app/src/components/KsqlDb
git commit -m "feat: localize core page copy"
```

## Task 6: Final Verification And Cleanup

**Files:**

- Modify: any remaining failing tests discovered in prior tasks

- [ ] **Step 1: Run a final grep for leftover hardcoded English UI strings**

Run: `rg -n "\"[A-Za-z][^\"]+\"|>[A-Za-z][^<]+<" kafka-ui-react-app/src/components kafka-ui-react-app/src/widgets -g '!**/__test__/**'`

Expected: only product names, route fragments, API literals, or intentionally untranslated backend payload strings remain.

- [ ] **Step 2: Run the frontend test suite**

Run: `cd kafka-ui-react-app && pnpm test -- --runInBand`

Expected: PASS.

- [ ] **Step 3: Run a production build**

Run: `cd kafka-ui-react-app && pnpm build`

Expected: PASS with no TypeScript or bundling errors.

- [ ] **Step 4: Smoke-check browser locale persistence manually**

Run:

```bash
cd kafka-ui-react-app
pnpm dev
```

Expected manual checks:

- browser locale `zh-CN` opens in Chinese
- language switcher changes the shell immediately
- refresh preserves the chosen locale
- topic clear confirmation and success toast use the selected locale

- [ ] **Step 5: Commit final cleanup**

```bash
git add kafka-ui-react-app
git commit -m "test: finalize frontend localization coverage"
```

## Self-Review

### Spec Coverage

- Browser locale detection: Task 1 and Task 2
- Top-nav language switching: Task 3
- `localStorage` persistence: Task 2 and Task 3
- Shared UI text localization: Task 3
- Frontend-generated notifications: Task 4
- Core page migration: Task 5
- Final verification and regression protection: Task 6
- Backend raw error text exclusion: preserved by scope in Tasks 4 to 6

### Placeholder Scan

- No `TBD` or deferred implementation markers are intentionally left in the plan.
- The only open-ended sweep is Task 5, but it includes the concrete grep command, migration order, and the TDD loop to apply for each page family.

### Type Consistency

- Locale codes are consistently `en` and `zh-CN`.
- Translation access stays on `useTranslation()` and `t(key, params?)`.
- `LocaleProvider` is the single source of locale state, with `localStorage` key `locale`.
