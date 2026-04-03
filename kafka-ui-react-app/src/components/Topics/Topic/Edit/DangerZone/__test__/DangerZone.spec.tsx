import React from 'react';
import DangerZone, {
  DangerZoneProps,
} from 'components/Topics/Topic/Edit/DangerZone/DangerZone';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, WithRoute } from 'lib/testHelpers';
import {
  useIncreaseTopicPartitionsCount,
  useUpdateTopicReplicationFactor,
} from 'lib/hooks/api/topics';
import { clusterTopicPath } from 'lib/paths';

const defaultPartitions = 3;
const defaultReplicationFactor = 3;

const clusterName = 'testCluster';
const topicName = 'testTopic';

jest.mock('lib/hooks/api/topics', () => ({
  useIncreaseTopicPartitionsCount: jest.fn(),
  useUpdateTopicReplicationFactor: jest.fn(),
}));

const renderComponent = (props?: Partial<DangerZoneProps>) =>
  render(
    <WithRoute path={clusterTopicPath()}>
      <DangerZone
        defaultPartitions={defaultPartitions}
        defaultReplicationFactor={defaultReplicationFactor}
        {...props}
      />
    </WithRoute>,
    { initialEntries: [clusterTopicPath(clusterName, topicName)] }
  );

const clickOnDialogSubmitButton = async () => {
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: '确认',
    })
  );
};

const checkDialogThenPressCancel = async () => {
  const dialog = screen.getByRole('dialog');
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await userEvent.click(within(dialog).getByRole('button', { name: '取消' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
};

describe('DangerZone', () => {
  beforeEach(() => {
    localStorage.setItem('locale', 'zh-CN');
  });

  it('renders the component', () => {
    renderComponent();

    const numberOfPartitionsEditForm = screen.getByRole('form', {
      name: '编辑分区数',
    });
    expect(numberOfPartitionsEditForm).toBeInTheDocument();
    expect(
      within(numberOfPartitionsEditForm).getByRole('spinbutton', {
        name: '分区数 *',
      })
    ).toBeInTheDocument();
    expect(
      within(numberOfPartitionsEditForm).getByRole('button', { name: '提交' })
    ).toBeInTheDocument();

    const replicationFactorEditForm = screen.getByRole('form', {
      name: '编辑副本因子',
    });
    expect(replicationFactorEditForm).toBeInTheDocument();
    expect(
      within(replicationFactorEditForm).getByRole('spinbutton', {
        name: '副本因子 *',
      })
    ).toBeInTheDocument();
    expect(
      within(replicationFactorEditForm).getByRole('button', { name: '提交' })
    ).toBeInTheDocument();
  });

  it('calls increaseTopicPartitionsCount mutation', async () => {
    const mockIncreaseTopicPartitionsCount = jest.fn();
    (useIncreaseTopicPartitionsCount as jest.Mock).mockImplementation(() => ({
      mutateAsync: mockIncreaseTopicPartitionsCount,
    }));
    renderComponent();
    const numberOfPartitionsEditForm = screen.getByRole('form', {
      name: '编辑分区数',
    });
    await userEvent.type(
      within(numberOfPartitionsEditForm).getByRole('spinbutton'),
      '4'
    );
    await userEvent.click(
      within(numberOfPartitionsEditForm).getByRole('button')
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await clickOnDialogSubmitButton();
    expect(mockIncreaseTopicPartitionsCount).toHaveBeenCalledTimes(1);
  });

  it('calls updateTopicReplicationFactor', async () => {
    const mockUpdateTopicReplicationFactor = jest.fn();
    (useUpdateTopicReplicationFactor as jest.Mock).mockImplementation(() => ({
      mutateAsync: mockUpdateTopicReplicationFactor,
    }));
    renderComponent();
    const replicationFactorEditForm = screen.getByRole('form', {
      name: '编辑副本因子',
    });
    expect(
      within(replicationFactorEditForm).getByRole('spinbutton', {
        name: '副本因子 *',
      })
    ).toBeInTheDocument();
    expect(
      within(replicationFactorEditForm).getByRole('button', { name: '提交' })
    ).toBeInTheDocument();

    await userEvent.type(
      within(replicationFactorEditForm).getByRole('spinbutton'),
      '4'
    );
    await userEvent.click(
      within(replicationFactorEditForm).getByRole('button')
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await clickOnDialogSubmitButton();

    expect(mockUpdateTopicReplicationFactor).toHaveBeenCalledTimes(1);
  });

  it('should view the validation error when partition value is lower than the default passed or empty', async () => {
    renderComponent();
    const partitionInput = screen.getByPlaceholderText('分区数');
    const partitionInputSubmitBtn = screen.getAllByText('提交')[0];
    const value = (defaultPartitions - 4).toString();
    expect(partitionInputSubmitBtn).toBeDisabled();

    await userEvent.clear(partitionInput);
    await userEvent.type(partitionInput, value);

    expect(partitionInput).toHaveValue(+value);
    expect(partitionInputSubmitBtn).toBeEnabled();

    await userEvent.click(partitionInputSubmitBtn);

    expect(screen.getByText('只能增加分区数！')).toBeInTheDocument();
    await userEvent.clear(partitionInput);
    expect(screen.getByText('分区数为必填项')).toBeInTheDocument();
  });

  it('should view the validation error when Replication Facto value is lower than the default passed or empty', async () => {
    renderComponent();
    const replicatorFactorInput = screen.getByPlaceholderText('副本因子');
    const replicatorFactorInputSubmitBtn = screen.getAllByText('提交')[1];

    await userEvent.clear(replicatorFactorInput);

    expect(replicatorFactorInputSubmitBtn).toBeEnabled();
    await userEvent.click(replicatorFactorInputSubmitBtn);
    expect(screen.getByText('副本因子为必填项')).toBeInTheDocument();
    await userEvent.type(replicatorFactorInput, '1');
    expect(screen.queryByText('副本因子为必填项')).not.toBeInTheDocument();
  });

  it('should close the partitions dialog if he cancel button is pressed', async () => {
    renderComponent();

    const partitionInput = screen.getByPlaceholderText('分区数');
    const partitionInputSubmitBtn = screen.getAllByText('提交')[0];

    await userEvent.type(partitionInput, '5');
    await userEvent.click(partitionInputSubmitBtn);

    await checkDialogThenPressCancel();
  });

  it('should close the replicator dialog if he cancel button is pressed', async () => {
    renderComponent();
    const replicatorFactorInput = screen.getByPlaceholderText('副本因子');
    const replicatorFactorInputSubmitBtn = screen.getAllByText('提交')[1];

    await userEvent.type(replicatorFactorInput, '5');
    await userEvent.click(replicatorFactorInputSubmitBtn);

    await checkDialogThenPressCancel();
  });
});
