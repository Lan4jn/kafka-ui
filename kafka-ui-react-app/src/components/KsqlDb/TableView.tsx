import React from 'react';
import { KsqlStreamDescription, KsqlTableDescription } from 'generated-sources';
import Table from 'components/common/NewTable';
import { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'components/contexts/LocaleContext';

interface TableViewProps {
  fetching: boolean;
  rows: KsqlTableDescription[] | KsqlStreamDescription[];
}

const TableView: React.FC<TableViewProps> = ({ fetching, rows }) => {
  const { t } = useTranslation();
  const columns = React.useMemo<
    ColumnDef<KsqlTableDescription | KsqlStreamDescription>[]
  >(
    () => [
      { header: t('ksqlDb.table.name'), accessorKey: 'name' },
      { header: t('ksqlDb.table.topic'), accessorKey: 'topic' },
      { header: t('ksqlDb.table.keyFormat'), accessorKey: 'keyFormat' },
      { header: t('ksqlDb.table.valueFormat'), accessorKey: 'valueFormat' },
      {
        header: t('ksqlDb.table.isWindowed'),
        accessorKey: 'isWindowed',
        cell: ({ row }) =>
          'isWindowed' in row.original ? String(row.original.isWindowed) : '-',
      },
    ],
    [t]
  );
  return (
    <Table
      data={rows || []}
      columns={columns}
      emptyMessage={fetching ? t('common.loading') : t('common.table.noRows')}
      enableSorting
    />
  );
};

export default TableView;
