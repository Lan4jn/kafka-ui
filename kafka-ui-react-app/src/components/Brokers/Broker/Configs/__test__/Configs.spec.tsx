import React from 'react';
import { screen } from '@testing-library/dom';
import { render, WithRoute } from 'lib/testHelpers';
import { clusterBrokerConfigsPath } from 'lib/paths';
import { useBrokerConfig } from 'lib/hooks/api/brokers';
import { brokerConfigPayload } from 'lib/fixtures/brokers';
import Configs from 'components/Brokers/Broker/Configs/Configs';
import userEvent from '@testing-library/user-event';

const clusterName = 'Cluster_Name';
const brokerId = 'Broker_Id';

jest.mock('lib/hooks/api/brokers', () => ({
  useBrokerConfig: jest.fn(),
  useUpdateBrokerConfigByName: jest.fn(),
}));

describe('Configs', () => {
  const renderComponent = () => {
    const path = clusterBrokerConfigsPath(clusterName, brokerId);
    return render(
      <WithRoute path={clusterBrokerConfigsPath()}>
        <Configs />
      </WithRoute>,
      { initialEntries: [path] }
    );
  };

  beforeEach(() => {
    localStorage.setItem('locale', 'zh-CN');
    (useBrokerConfig as jest.Mock).mockImplementation(() => ({
      data: brokerConfigPayload,
    }));
    renderComponent();
  });

  it('renders configs table', async () => {
    expect(screen.getByPlaceholderText('按键或值搜索')).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '键' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '值' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '来源' })
    ).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row').length).toEqual(
      brokerConfigPayload.length + 1
    );
  });

  it('shows localized source tooltip', async () => {
    await userEvent.hover(
      screen
        .getByRole('columnheader', { name: '来源' })
        .querySelector('svg') as Element
    );
    expect(
      screen.getAllByText(
        (_, element) =>
          element?.textContent?.includes(
            'DYNAMIC_TOPIC_CONFIG = 为特定主题配置的动态主题配置'
          ) || false
      ).length
    ).toBeGreaterThan(0);
  });

  it('updates textbox value', async () => {
    await userEvent.click(screen.getAllByLabelText('editAction')[0]);

    const textbox = screen.getByLabelText('inputValue');
    expect(textbox).toBeInTheDocument();
    expect(textbox).toHaveValue('producer');

    await userEvent.type(textbox, 'new value');

    expect(
      screen.getByRole('button', { name: 'confirmAction' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'cancelAction' })
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'confirmAction' })
    );

    expect(screen.getByText('确定要修改该值吗？')).toBeInTheDocument();
  });
});
