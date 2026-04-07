import React from 'react';
import { render, WithRoute } from 'lib/testHelpers';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClusterContext from 'components/contexts/ClusterContext';
import { clusterConsumerGroupDetailsPath } from 'lib/paths';
import Details from 'components/ConsumerGroups/Details/Details';
import { consumerGroupPayload } from 'lib/fixtures/consumerGroups';
import {
  useConsumerGroupDetails,
  useDeleteConsumerGroupMutation,
} from 'lib/hooks/api/consumers';

jest.mock('lib/hooks/api/consumers', () => ({
  useConsumerGroupDetails: jest.fn(),
  useDeleteConsumerGroupMutation: jest.fn(),
}));

jest.mock('components/ConsumerGroups/Details/ListItem', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => (
    <tr>
      <td>{name}</td>
    </tr>
  ),
}));

const clusterName = 'local';
const consumerGroupID = 'group-id';

describe('ConsumerGroups Details', () => {
  const renderComponent = () =>
    render(
      <ClusterContext.Provider
        value={{
          isReadOnly: false,
          hasKafkaConnectConfigured: true,
          hasSchemaRegistryConfigured: true,
          isTopicDeletionAllowed: true,
        }}
      >
        <WithRoute path={clusterConsumerGroupDetailsPath()}>
          <Details />
        </WithRoute>
      </ClusterContext.Provider>,
      {
        initialEntries: [
          clusterConsumerGroupDetailsPath(clusterName, consumerGroupID),
        ],
      }
    );

  beforeEach(() => {
    localStorage.setItem('locale', 'zh-CN');
    (useConsumerGroupDetails as jest.Mock).mockReturnValue({
      data: { ...consumerGroupPayload, groupId: consumerGroupID },
    });
    (useDeleteConsumerGroupMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });
  });

  it('renders localized controls and confirmation content', async () => {
    renderComponent();

    expect(screen.getByRole('link', { name: '消费者组' })).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
    expect(screen.getByText('成员数')).toBeInTheDocument();
    expect(screen.getByText('已分配主题数')).toBeInTheDocument();
    expect(screen.getByText('已分配分区数')).toBeInTheDocument();
    expect(screen.getByText('协调器 ID')).toBeInTheDocument();
    expect(screen.getByText('总积压')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('按主题名称搜索')).toBeInTheDocument();
    expect(screen.getByText('主题')).toBeInTheDocument();
    expect(screen.getByText('消费积压')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Dropdown Toggle' })
    );

    expect(screen.getByText('重置偏移量')).toBeInTheDocument();
    expect(screen.getByText('删除消费者组')).toBeInTheDocument();

    await userEvent.click(screen.getByText('删除消费者组'));

    expect(screen.getByText('确定要删除这个消费者组吗？')).toBeInTheDocument();
  });
});
