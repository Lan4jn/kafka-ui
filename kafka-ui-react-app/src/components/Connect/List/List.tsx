import React from 'react';
import useAppParams from 'lib/hooks/useAppParams';
import { clusterConnectConnectorPath, ClusterNameRoute } from 'lib/paths';
import Table, { TagCell } from 'components/common/NewTable';
import { FullConnectorInfo } from 'generated-sources';
import { useConnectors } from 'lib/hooks/api/kafkaConnect';
import { ColumnDef } from '@tanstack/react-table';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'components/contexts/LocaleContext';

import ActionsCell from './ActionsCell';
import TopicsCell from './TopicsCell';
import RunningTasksCell from './RunningTasksCell';

const List: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clusterName } = useAppParams<ClusterNameRoute>();
  const [searchParams] = useSearchParams();
  const { data: connectors } = useConnectors(
    clusterName,
    searchParams.get('q') || ''
  );

  const columns = React.useMemo<ColumnDef<FullConnectorInfo>[]>(
    () => [
      { header: t('connect.list.table.name'), accessorKey: 'name' },
      { header: t('connect.list.table.connect'), accessorKey: 'connect' },
      { header: t('connect.list.table.type'), accessorKey: 'type' },
      {
        header: t('connect.list.table.plugin'),
        accessorKey: 'connectorClass',
      },
      { header: t('connect.list.table.topics'), cell: TopicsCell },
      {
        header: t('connect.list.table.status'),
        accessorKey: 'status.state',
        cell: TagCell,
      },
      { header: t('connect.list.table.runningTasks'), cell: RunningTasksCell },
      { header: '', id: 'action', cell: ActionsCell },
    ],
    [t]
  );

  return (
    <Table
      data={connectors || []}
      columns={columns}
      enableSorting
      onRowClick={({ original: { connect, name } }) =>
        navigate(clusterConnectConnectorPath(clusterName, connect, name))
      }
      emptyMessage={t('connect.list.empty')}
    />
  );
};

export default List;
