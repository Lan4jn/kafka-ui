import React from 'react';
import { TopicAnalysisStats } from 'generated-sources';
import { ColumnDef } from '@tanstack/react-table';
import Table from 'components/common/NewTable';
import { useTranslation } from 'components/contexts/LocaleContext';

import PartitionInfoRow from './PartitionInfoRow';

const PartitionTable: React.FC<{ data: TopicAnalysisStats[] }> = ({ data }) => {
  const { t } = useTranslation();
  const columns = React.useMemo<ColumnDef<TopicAnalysisStats>[]>(
    () => [
      {
        header: t('topics.statistics.partitionTable.partitionId'),
        accessorKey: 'partition',
      },
      {
        header: t('topics.statistics.partitionTable.totalMessages'),
        accessorKey: 'totalMsgs',
      },
      {
        header: t('topics.statistics.partitionTable.minOffset'),
        accessorKey: 'minOffset',
      },
      {
        header: t('topics.statistics.partitionTable.maxOffset'),
        accessorKey: 'maxOffset',
      },
    ],
    [t]
  );

  return (
    <Table
      data={data}
      columns={columns}
      getRowCanExpand={() => true}
      renderSubComponent={PartitionInfoRow}
      enableSorting
    />
  );
};

export default PartitionTable;
