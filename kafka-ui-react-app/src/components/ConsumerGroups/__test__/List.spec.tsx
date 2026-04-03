import React from 'react';
import { screen } from '@testing-library/react';
import List from 'components/ConsumerGroups/List';
import { render, WithRoute } from 'lib/testHelpers';
import { clusterConsumerGroupsPath } from 'lib/paths';
import { useConsumerGroups } from 'lib/hooks/api/consumers';
import { consumerGroupPayload } from 'lib/fixtures/consumerGroups';

jest.mock('lib/hooks/api/consumers', () => ({
  useConsumerGroups: jest.fn(),
}));

const clusterName = 'cluster1';

describe('ConsumerGroups List', () => {
  const renderComponent = ({
    data,
    isSuccess = true,
    isFetching = false,
  }: {
    data?: {
      pageCount: number;
      consumerGroups: typeof consumerGroupPayload[];
    };
    isSuccess?: boolean;
    isFetching?: boolean;
  }) => {
    localStorage.setItem('locale', 'zh-CN');

    (useConsumerGroups as jest.Mock).mockReturnValue({
      data,
      isSuccess,
      isFetching,
    });

    render(
      <WithRoute path={clusterConsumerGroupsPath()}>
        <List />
      </WithRoute>,
      {
        initialEntries: [clusterConsumerGroupsPath(clusterName)],
      }
    );
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('renders localized consumer groups copy in Chinese', () => {
    renderComponent({
      data: {
        pageCount: 1,
        consumerGroups: [consumerGroupPayload],
      },
    });

    expect(screen.getByText('消费者组')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('按 Consumer Group ID 搜索')
    ).toBeInTheDocument();
    expect(screen.getByText('组 ID')).toBeInTheDocument();
    expect(screen.getByText('成员数')).toBeInTheDocument();
    expect(screen.getByText('主题数')).toBeInTheDocument();
    expect(screen.getByText('消费积压')).toBeInTheDocument();
    expect(screen.getByText('协调器')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
  });

  it('renders localized loading state', () => {
    renderComponent({
      data: undefined,
      isSuccess: false,
      isFetching: true,
    });

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders localized empty state', () => {
    renderComponent({
      data: {
        pageCount: 0,
        consumerGroups: [],
      },
      isSuccess: true,
      isFetching: false,
    });

    expect(screen.getByText('未找到活跃消费者组')).toBeInTheDocument();
  });
});
