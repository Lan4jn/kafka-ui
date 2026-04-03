import React from 'react';
import { screen } from '@testing-library/react';
import { render, WithRoute } from 'lib/testHelpers';
import Overview from 'components/Topics/Topic/Overview/Overview';
import { theme } from 'theme/theme';
import { CleanUpPolicy, Topic } from 'generated-sources';
import ClusterContext from 'components/contexts/ClusterContext';
import userEvent from '@testing-library/user-event';
import { clusterTopicPath } from 'lib/paths';
import { Replica } from 'components/Topics/Topic/Overview/Overview.styled';
import { useClearTopicMessages, useTopicDetails } from 'lib/hooks/api/topics';
import {
  externalTopicPayload,
  internalTopicPayload,
} from 'lib/fixtures/topics';

const clusterName = 'local';
const topicName = 'topic';
const defaultContextValues = {
  isReadOnly: false,
  hasKafkaConnectConfigured: true,
  hasSchemaRegistryConfigured: true,
  isTopicDeletionAllowed: true,
};

jest.mock('lib/hooks/api/topics', () => ({
  useTopicDetails: jest.fn(),
  useClearTopicMessages: jest.fn(),
}));

const clearTopicMessage = jest.fn();

describe('Overview', () => {
  const renderComponent = (
    topic: Topic = externalTopicPayload,
    context = defaultContextValues
  ) => {
    (useTopicDetails as jest.Mock).mockImplementation(() => ({
      data: topic,
    }));
    (useClearTopicMessages as jest.Mock).mockImplementation(() => ({
      mutateAsync: clearTopicMessage,
    }));
    const path = clusterTopicPath(clusterName, topicName);
    return render(
      <WithRoute path={clusterTopicPath()}>
        <ClusterContext.Provider value={context}>
          <Overview />
        </ClusterContext.Provider>
      </WithRoute>,
      { initialEntries: [path] }
    );
  };

  it('at least one replica was rendered', () => {
    renderComponent();
    expect(screen.getByLabelText('replica-info')).toBeInTheDocument();
  });

  it('renders replica cell with props', () => {
    render(<Replica leader />);
    const element = screen.getByLabelText('replica-info');
    expect(element).toBeInTheDocument();
    expect(element).toHaveStyleRule(
      'color',
      theme.topicMetaData.liderReplica.color
    );
  });

  describe('when replicas out of sync', () => {
    it('should be the appropriate color', () => {
      render(<Replica outOfSync />);
      const element = screen.getByLabelText('replica-info');
      expect(element).toBeInTheDocument();
      expect(element).toHaveStyleRule(
        'color',
        theme.topicMetaData.outOfSync.color
      );
      expect(element).toHaveStyleRule('font-weight', '500');
    });
  });

  describe('when it has internal flag', () => {
    it('renders the Action button for Topic', () => {
      renderComponent({
        ...externalTopicPayload,
        cleanUpPolicy: CleanUpPolicy.DELETE,
      });
      expect(screen.getAllByLabelText('Dropdown Toggle').length).toEqual(1);
    });

    it('does not render Partitions', () => {
      localStorage.setItem('locale', 'zh-CN');
      renderComponent({ ...externalTopicPayload, partitions: [] });
      expect(screen.getByText('未找到分区')).toBeInTheDocument();
    });
  });

  it('renders localized metric labels and table headers', () => {
    localStorage.setItem('locale', 'zh-CN');
    renderComponent({
      ...externalTopicPayload,
      partitions: [
        {
          ...externalTopicPayload.partitions[0],
          replicas: [{ broker: 1, leader: true, inSync: true }],
        },
      ],
    });
    expect(screen.getByText('分区')).toBeInTheDocument();
    expect(screen.getByText('副本因子')).toBeInTheDocument();
    expect(screen.getByText('同步副本')).toBeInTheDocument();
    expect(screen.getByText('清理策略')).toBeInTheDocument();
    expect(screen.getAllByText('消息数')[0]).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '分区 ID' })
    ).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '副本' })).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '起始偏移量' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '下一个偏移量' })
    ).toBeInTheDocument();
    expect(screen.getByTitle('主副本')).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === '1 / 1')
    ).toBeInTheDocument();
  });

  describe('should render circular alert', () => {
    it('should be in document', () => {
      renderComponent();
      const circles = screen.getAllByRole('circle');
      expect(circles.length).toEqual(2);
    });

    it('should be the appropriate color', () => {
      renderComponent({
        ...externalTopicPayload,
        underReplicatedPartitions: 0,
        inSyncReplicas: 1,
        replicas: 2,
      });
      const circles = screen.getAllByRole('circle');
      expect(circles[0]).toHaveStyle(
        `fill: ${theme.circularAlert.color.success}`
      );
      expect(circles[1]).toHaveStyle(
        `fill: ${theme.circularAlert.color.error}`
      );
    });
  });

  describe('when Clear Messages is clicked', () => {
    it('should when Clear Messages is clicked', async () => {
      renderComponent({
        ...externalTopicPayload,
        cleanUpPolicy: CleanUpPolicy.DELETE,
      });

      const clearMessagesButton = screen.getByText('Clear Messages');
      await userEvent.click(clearMessagesButton);
      expect(clearTopicMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the table partition dropdown appearance', () => {
    it('should check if the dropdown is disabled when it is readOnly', () => {
      renderComponent(
        {
          ...externalTopicPayload,
        },
        { ...defaultContextValues, isReadOnly: true }
      );
      expect(screen.getByLabelText('Dropdown Toggle')).toBeDisabled();
    });

    it('should check if the dropdown is disabled when it is internal', () => {
      renderComponent({
        ...internalTopicPayload,
      });
      expect(screen.getByLabelText('Dropdown Toggle')).toBeDisabled();
    });

    it('should check if the dropdown is disabled when cleanUpPolicy is not DELETE', () => {
      renderComponent({
        ...externalTopicPayload,
        cleanUpPolicy: CleanUpPolicy.COMPACT,
      });
      expect(screen.getByLabelText('Dropdown Toggle')).toBeDisabled();
    });
  });
});
