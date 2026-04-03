import React from 'react';
import { render, WithRoute } from 'lib/testHelpers';
import { screen } from '@testing-library/react';
import ClusterContext from 'components/contexts/ClusterContext';
import userEvent from '@testing-library/user-event';
import { clusterTopicsPath } from 'lib/paths';
import ListPage from 'components/Topics/List/ListPage';

const clusterName = 'test-cluster';

jest.mock('components/Topics/List/TopicTable', () => () => <>TopicTableMock</>);

describe('ListPage Component', () => {
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
        <WithRoute path={clusterTopicsPath()}>
          <ListPage />
        </WithRoute>
      </ClusterContext.Provider>,
      { initialEntries: [clusterTopicsPath(clusterName)] }
    );

  describe('Component Render', () => {
    beforeEach(() => {
      localStorage.setItem('locale', 'zh-CN');
      renderComponent();
    });

    it('renders localized page controls', () => {
      expect(
        screen.getByRole('heading', { name: '主题' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: '新增主题' })
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('按主题名称搜索')
      ).toBeInTheDocument();
      expect(screen.getByLabelText('显示内部主题')).toBeInTheDocument();
    });

    it('handles switch of Internal Topics visibility', async () => {
      const switchInput = screen.getByLabelText('显示内部主题');
      expect(switchInput).toBeInTheDocument();

      expect(global.localStorage.getItem('hideInternalTopics')).toBeNull();
      await userEvent.click(switchInput);
      expect(global.localStorage.getItem('hideInternalTopics')).toBeTruthy();
      await userEvent.click(switchInput);
      expect(global.localStorage.getItem('hideInternalTopics')).toBeNull();
    });

    it('renders the TopicsTable', () => {
      expect(screen.getByText('TopicTableMock')).toBeInTheDocument();
    });
  });
});
