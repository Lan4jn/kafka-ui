import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from 'components/App';
import { render } from 'lib/testHelpers';
import { useGetUserInfo } from 'lib/hooks/api/roles';
import { useAppInfo } from 'lib/hooks/api/appConfig';
import { useClusters } from 'lib/hooks/api/clusters';

jest.mock('components/Dashboard/Dashboard', () => () => (
  <div>Dashboard Page</div>
));

jest.mock('components/Version/Version', () => () => <div>Version</div>);

jest.mock('components/NavBar/UserInfo/UserInfo', () => () => (
  <div>User Info</div>
));

jest.mock('lib/hooks/api/roles', () => ({
  useGetUserInfo: jest.fn(),
}));
jest.mock('lib/hooks/api/appConfig', () => ({
  useAppInfo: jest.fn(),
}));
jest.mock('lib/hooks/api/clusters', () => ({
  useClusters: jest.fn(),
}));

const originalNavigatorLanguage = window.navigator.language;
const originalNavigatorLanguages = window.navigator.languages;

const setNavigatorLanguage = (language: string, languages?: string[]) => {
  Object.defineProperty(window.navigator, 'language', {
    configurable: true,
    value: language,
  });
  Object.defineProperty(window.navigator, 'languages', {
    configurable: true,
    value: languages ?? [language],
  });
};

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();

    (useGetUserInfo as jest.Mock).mockImplementation(() => ({
      data: {},
    }));
    (useAppInfo as jest.Mock).mockImplementation(() => ({
      data: {},
    }));
    (useClusters as jest.Mock).mockImplementation(() => ({
      isSuccess: true,
      data: [],
    }));
  });

  afterEach(() => {
    setNavigatorLanguage(originalNavigatorLanguage, [
      ...originalNavigatorLanguages,
    ]);
  });

  it('renders Chinese shell copy when browser locale is Chinese', () => {
    setNavigatorLanguage('zh-CN');

    render(<App />, {
      initialEntries: ['/'],
    });

    expect(screen.getByText('简体中文')).toBeInTheDocument();
    expect(screen.getByText('仪表盘')).toBeInTheDocument();
  });

  it('restores the original navigator locale between tests', () => {
    expect(window.navigator.language).toBe(originalNavigatorLanguage);
    expect(window.navigator.languages).toEqual(originalNavigatorLanguages);
  });

  it('updates localStorage when language is changed from the navbar', async () => {
    setNavigatorLanguage('en-US');

    render(<App />, {
      initialEntries: ['/'],
    });

    const user = userEvent.setup();

    await user.click(screen.getByText('English'));
    await user.click(screen.getByText(/简体中文|Chinese \(Simplified\)/));

    expect(localStorage.getItem('locale')).toBe('zh-CN');
  });
});
