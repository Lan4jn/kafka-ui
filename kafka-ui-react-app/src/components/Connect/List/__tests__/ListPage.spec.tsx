import React from 'react';
import { connectors } from 'lib/fixtures/kafkaConnect';
import ClusterContext, {
  ContextProps,
  initialValue,
} from 'components/contexts/ClusterContext';
import ListPage from 'components/Connect/List/ListPage';
import { screen, within } from '@testing-library/react';
import { render, WithRoute } from 'lib/testHelpers';
import { clusterConnectorsPath } from 'lib/paths';
import { useConnectors } from 'lib/hooks/api/kafkaConnect';

jest.mock('components/Connect/List/List', () => () => (
  <div>Connectors List</div>
));

jest.mock('lib/hooks/api/kafkaConnect', () => ({
  useConnectors: jest.fn(),
}));

jest.mock('components/common/Icons/SpinnerIcon', () => () => 'progressbar');

const clusterName = 'local';

describe('Connectors List Page', () => {
  beforeEach(() => {
    localStorage.setItem('locale', 'zh-CN');
    (useConnectors as jest.Mock).mockImplementation(() => ({
      isLoading: false,
      data: [],
    }));
  });

  const renderComponent = async (contextValue: ContextProps = initialValue) =>
    render(
      <ClusterContext.Provider value={contextValue}>
        <WithRoute path={clusterConnectorsPath()}>
          <ListPage />
        </WithRoute>
      </ClusterContext.Provider>,
      { initialEntries: [clusterConnectorsPath(clusterName)] }
    );

  afterEach(() => {
    localStorage.clear();
  });

  describe('Heading', () => {
    it('renders header without create button for readonly cluster', async () => {
      await renderComponent({ ...initialValue, isReadOnly: true });
      expect(
        screen.getByRole('heading', { name: 'Connectors' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: '创建 Connector' })
      ).not.toBeInTheDocument();
    });

    it('renders header with create button for read/write cluster', async () => {
      await renderComponent();
      expect(
        screen.getByRole('heading', { name: 'Connectors' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: '创建 Connector' })
      ).toBeInTheDocument();
    });
  });

  it('renders search input', async () => {
    await renderComponent();
    expect(
      screen.getByPlaceholderText('按 Connect 名称、状态或类型搜索')
    ).toBeInTheDocument();
  });

  it('renders list', async () => {
    await renderComponent();
    expect(screen.getByText('Connectors List')).toBeInTheDocument();
  });

  describe('Metrics', () => {
    it('renders indicators in loading state', async () => {
      (useConnectors as jest.Mock).mockImplementation(() => ({
        isLoading: true,
        data: connectors,
      }));

      await renderComponent();
      const metrics = screen.getByRole('group');
      expect(metrics).toBeInTheDocument();
      expect(within(metrics).getAllByText('progressbar').length).toEqual(3);
    });

    it('renders indicators for empty list of connectors', async () => {
      await renderComponent();
      const metrics = screen.getByRole('group');
      expect(metrics).toBeInTheDocument();

      const connectorsIndicator = within(metrics).getByTitle('Connectors 总数');
      expect(connectorsIndicator).toBeInTheDocument();
      expect(connectorsIndicator).toHaveTextContent('Connectors -');

      const failedConnectorsIndicator =
        within(metrics).getByTitle('失败的 Connectors 数量');
      expect(failedConnectorsIndicator).toBeInTheDocument();
      expect(failedConnectorsIndicator).toHaveTextContent(
        '失败的 Connectors 0'
      );

      const failedTasksIndicator = within(metrics).getByTitle('失败的任务数量');
      expect(failedTasksIndicator).toBeInTheDocument();
      expect(failedTasksIndicator).toHaveTextContent('失败的任务 0');
    });

    it('renders indicators when connectors list is undefined', async () => {
      (useConnectors as jest.Mock).mockImplementation(() => ({
        isFetching: false,
        data: undefined,
      }));

      await renderComponent();
      const metrics = screen.getByRole('group');
      expect(metrics).toBeInTheDocument();

      const connectorsIndicator = within(metrics).getByTitle('Connectors 总数');
      expect(connectorsIndicator).toBeInTheDocument();
      expect(connectorsIndicator).toHaveTextContent('Connectors -');

      const failedConnectorsIndicator =
        within(metrics).getByTitle('失败的 Connectors 数量');
      expect(failedConnectorsIndicator).toBeInTheDocument();
      expect(failedConnectorsIndicator).toHaveTextContent(
        '失败的 Connectors -'
      );

      const failedTasksIndicator = within(metrics).getByTitle('失败的任务数量');
      expect(failedTasksIndicator).toBeInTheDocument();
      expect(failedTasksIndicator).toHaveTextContent('失败的任务 -');
    });

    it('renders indicators list of connectors', async () => {
      (useConnectors as jest.Mock).mockImplementation(() => ({
        isLoading: false,
        data: connectors,
      }));

      await renderComponent();

      const metrics = screen.getByRole('group');
      expect(metrics).toBeInTheDocument();

      const connectorsIndicator = within(metrics).getByTitle('Connectors 总数');
      expect(connectorsIndicator).toBeInTheDocument();
      expect(connectorsIndicator).toHaveTextContent(
        `Connectors ${connectors.length}`
      );

      const failedConnectorsIndicator =
        within(metrics).getByTitle('失败的 Connectors 数量');
      expect(failedConnectorsIndicator).toBeInTheDocument();
      expect(failedConnectorsIndicator).toHaveTextContent(
        '失败的 Connectors 1'
      );

      const failedTasksIndicator = within(metrics).getByTitle('失败的任务数量');
      expect(failedTasksIndicator).toBeInTheDocument();
      expect(failedTasksIndicator).toHaveTextContent('失败的任务 1');
    });
  });
});
