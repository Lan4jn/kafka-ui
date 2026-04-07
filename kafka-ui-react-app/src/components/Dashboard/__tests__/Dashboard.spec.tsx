import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from 'components/Dashboard/Dashboard';
import { render } from 'lib/testHelpers';
import { useClusters } from 'lib/hooks/api/clusters';
import { useGetUserInfo } from 'lib/hooks/api/roles';
import { GLOSSARY_TERMS } from 'lib/glossaryTerms';
import {
  offlineClusterPayload,
  onlineClusterPayload,
} from 'lib/fixtures/clusters';

jest.mock('lib/hooks/api/clusters', () => ({
  useClusters: jest.fn(),
}));

jest.mock('lib/hooks/api/roles', () => ({
  useGetUserInfo: jest.fn(),
}));

describe('Dashboard', () => {
  const renderComponent = ({
    data = [],
    isFetched = true,
    hasDynamicConfig = true,
  }: {
    data?: (typeof onlineClusterPayload)[];
    isFetched?: boolean;
    hasDynamicConfig?: boolean;
  } = {}) => {
    localStorage.setItem('locale', 'zh-CN');

    (useClusters as jest.Mock).mockReturnValue({
      data,
      isFetched,
    });
    (useGetUserInfo as jest.Mock).mockReturnValue({
      data: {
        rbacEnabled: false,
      },
    });

    render(<Dashboard />, {
      globalSettings: { hasDynamicConfig },
    });
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('renders localized dashboard copy in Chinese', () => {
    renderComponent({
      data: [onlineClusterPayload, offlineClusterPayload],
    });

    expect(screen.getByText('仪表盘')).toBeInTheDocument();
    expect(screen.getByText('在线')).toBeInTheDocument();
    expect(screen.getByText('离线')).toBeInTheDocument();
    expect(screen.getAllByText('集群')).toHaveLength(2);
    expect(screen.getByText('仅显示离线集群')).toBeInTheDocument();
    expect(screen.getByText('配置新集群')).toBeInTheDocument();
    expect(screen.getByText('集群名称')).toBeInTheDocument();
    expect(screen.getByText('版本')).toBeInTheDocument();
    expect(screen.getByText('Broker 数量')).toBeInTheDocument();
    expect(screen.getByText('分区')).toBeInTheDocument();
    expect(screen.getByText('主题')).toBeInTheDocument();
    expect(screen.getByText('生产')).toBeInTheDocument();
    expect(screen.getByText('消费')).toBeInTheDocument();
  });

  it('renders localized loading state', () => {
    renderComponent({
      data: [],
      isFetched: false,
      hasDynamicConfig: false,
    });

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders localized empty state', () => {
    renderComponent({
      data: [],
      isFetched: true,
      hasDynamicConfig: false,
    });

    expect(screen.getByText('未找到集群')).toBeInTheDocument();
  });

  it('shows glossary tooltip for broker term in brokers column header', async () => {
    renderComponent({
      data: [onlineClusterPayload, offlineClusterPayload],
    });

    await userEvent.hover(screen.getByText('Broker 数量'));
    expect(await screen.findByText(GLOSSARY_TERMS.BROKER)).toBeInTheDocument();
  });
});
