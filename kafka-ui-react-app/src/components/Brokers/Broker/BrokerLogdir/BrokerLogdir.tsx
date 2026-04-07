import React from 'react';
import useAppParams from 'lib/hooks/useAppParams';
import { ClusterBrokerParam } from 'lib/paths';
import { useBrokerLogDirs } from 'lib/hooks/api/brokers';
import Table from 'components/common/NewTable';
import { ColumnDef } from '@tanstack/react-table';
import { BrokersLogdirs } from 'generated-sources';
import { useTranslation } from 'components/contexts/LocaleContext';

const BrokerLogdir: React.FC = () => {
  const { t } = useTranslation();
  const { clusterName, brokerId } = useAppParams<ClusterBrokerParam>();
  const { data } = useBrokerLogDirs(clusterName, Number(brokerId));

  const columns = React.useMemo<ColumnDef<BrokersLogdirs>[]>(
    () => [
      { header: t('brokers.logdirs.table.name'), accessorKey: 'name' },
      { header: t('brokers.logdirs.table.error'), accessorKey: 'error' },
      {
        header: t('brokers.logdirs.table.topics'),
        accessorKey: 'topics',
        cell: ({ getValue }) =>
          getValue<BrokersLogdirs['topics']>()?.length || 0,
        enableSorting: false,
      },
      {
        id: 'partitions',
        header: t('brokers.logdirs.table.partitions'),
        accessorKey: 'topics',
        cell: ({ getValue }) => {
          const topics = getValue<BrokersLogdirs['topics']>();
          if (!topics) {
            return 0;
          }
          return topics.reduce(
            (acc, topic) => acc + (topic.partitions?.length || 0),
            0
          );
        },
        enableSorting: false,
      },
    ],
    [t]
  );

  return (
    <Table
      data={data || []}
      columns={columns}
      emptyMessage={t('brokers.logdirs.empty')}
      enableSorting
    />
  );
};

export default BrokerLogdir;
