import React from 'react';
import { render, WithRoute } from 'lib/testHelpers';
import {
  clusterConnectConnectorPath,
  clusterConnectorNewPath,
} from 'lib/paths';
import New from 'components/Connect/New/New';
import { connects, connector } from 'lib/fixtures/kafkaConnect';
import { fireEvent, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ControllerRenderProps } from 'react-hook-form';
import { useConnects, useCreateConnector } from 'lib/hooks/api/kafkaConnect';

jest.mock(
  'components/common/Editor/Editor',
  () => (props: ControllerRenderProps) => {
    return <textarea {...props} placeholder="json" />;
  }
);

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockHistoryPush,
}));

jest.mock('lib/hooks/api/kafkaConnect', () => ({
  useConnects: jest.fn(),
  useCreateConnector: jest.fn(),
}));

describe('New', () => {
  const clusterName = 'my-cluster';
  const simulateFormSubmit = async () => {
    await userEvent.type(
      screen.getByPlaceholderText('Connector 名称'),
      'my-connector'
    );
    await userEvent.type(
      screen.getByPlaceholderText('json'),
      '{"class":"MyClass"}'.replace(/[{[]/g, '$&$&')
    );

    expect(screen.getByPlaceholderText('json')).toHaveValue(
      '{"class":"MyClass"}'
    );
    await act(() => {
      fireEvent.submit(screen.getByRole('form'));
    });
  };

  const renderComponent = () =>
    render(
      <WithRoute path={clusterConnectorNewPath()}>
        <New />
      </WithRoute>,
      { initialEntries: [clusterConnectorNewPath(clusterName)] }
    );

  beforeEach(() => {
    localStorage.setItem('locale', 'zh-CN');
    (useConnects as jest.Mock).mockImplementation(() => ({
      data: connects,
    }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders localized copy in Chinese', () => {
    (useCreateConnector as jest.Mock).mockImplementation(() => ({
      createResource: jest.fn(),
    }));
    renderComponent();

    expect(screen.getByText('创建新 Connector')).toBeInTheDocument();
    expect(screen.getByText('Connectors')).toBeInTheDocument();
    expect(screen.getByText('Connect *')).toBeInTheDocument();
    expect(screen.getByText('名称')).toBeInTheDocument();
    expect(screen.getByText('配置')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '提交' })
    ).toBeInTheDocument();
  });

  it('calls createConnector on form submit and redirects to the list page on success', async () => {
    const createConnectorMock = jest.fn(() => {
      return Promise.resolve(connector);
    });
    (useCreateConnector as jest.Mock).mockImplementation(() => ({
      createResource: createConnectorMock,
    }));
    renderComponent();
    await simulateFormSubmit();
    expect(createConnectorMock).toHaveBeenCalledTimes(1);
    expect(mockHistoryPush).toHaveBeenCalledTimes(1);
    expect(mockHistoryPush).toHaveBeenCalledWith(
      clusterConnectConnectorPath(clusterName, connects[0].name, connector.name)
    );
  });

  it('does not redirect to connector details view on unsuccessful submit', async () => {
    const createConnectorMock = jest.fn(() => {
      return Promise.resolve();
    });
    (useCreateConnector as jest.Mock).mockImplementation(() => ({
      createResource: createConnectorMock,
    }));
    renderComponent();
    await simulateFormSubmit();
    expect(mockHistoryPush).not.toHaveBeenCalled();
  });
});
