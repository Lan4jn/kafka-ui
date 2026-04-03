import React from 'react';
import { screen } from '@testing-library/react';
import { render, WithRoute } from 'lib/testHelpers';
import { clusterKsqlDbPath } from 'lib/paths';
import KsqlDb from 'components/KsqlDb/KsqlDb';
import QueryForm from 'components/KsqlDb/Query/QueryForm/QueryForm';
import TableRenderer from 'components/KsqlDb/Query/renderer/TableRenderer/TableRenderer';
import { useKsqlkDb } from 'lib/hooks/api/ksqlDb';

jest.mock('components/KsqlDb/TableView', () => () => <div>TableViewMock</div>);
jest.mock('components/KsqlDb/Query/Query', () => () => <div>QueryMock</div>);
jest.mock('lib/hooks/api/ksqlDb', () => ({
  useKsqlkDb: jest.fn(),
}));
jest.mock(
  'components/common/SQLEditor/SQLEditor',
  () =>
    React.forwardRef<
      HTMLTextAreaElement,
      React.TextareaHTMLAttributes<HTMLTextAreaElement>
    >((props, ref) => <textarea ref={ref} {...props} />)
);

const clusterName = 'local';

describe('KsqlDb', () => {
  beforeEach(() => {
    localStorage.clear();
    (useKsqlkDb as jest.Mock).mockReturnValue([
      {
        isFetching: false,
        isSuccess: true,
        data: [{ name: 'table-1' }],
      },
      {
        isFetching: false,
        isSuccess: true,
        data: [{ name: 'stream-1' }],
      },
    ]);
  });

  it('renders localized KSQL DB page copy in Chinese', () => {
    localStorage.setItem('locale', 'zh-CN');

    render(
      <WithRoute path={`${clusterKsqlDbPath()}/*`}>
        <KsqlDb />
      </WithRoute>,
      {
        initialEntries: [clusterKsqlDbPath(clusterName)],
      }
    );

    expect(screen.getByText('KSQL DB')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '执行 KSQL 请求' })
    ).toBeInTheDocument();
    expect(screen.getByText('数据表')).toBeInTheDocument();
    expect(screen.getByText('数据流')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '表' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '流' })).toBeInTheDocument();
  });

  it('renders localized query form copy in Chinese', () => {
    localStorage.setItem('locale', 'zh-CN');

    render(
      <QueryForm
        fetching={false}
        hasResults
        resetResults={jest.fn()}
        submitHandler={jest.fn()}
      />
    );

    expect(screen.getByText('清空')).toBeInTheDocument();
    expect(screen.getByText('流属性：')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('键')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('值')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '新增流属性' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '清空结果' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '执行' })).toBeInTheDocument();
  });

  it('renders localized empty table message in Chinese', () => {
    localStorage.setItem('locale', 'zh-CN');

    render(
      <TableRenderer
        table={{ header: 'Query Result', columnNames: [], values: [] }}
      />
    );

    expect(screen.getByText('未找到表或流')).toBeInTheDocument();
  });
});
