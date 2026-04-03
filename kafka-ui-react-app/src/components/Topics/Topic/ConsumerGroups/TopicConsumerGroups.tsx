import React from 'react';
import { clusterConsumerGroupsPath, RouteParamsClusterTopic } from 'lib/paths';
import { ConsumerGroup } from 'generated-sources';
import useAppParams from 'lib/hooks/useAppParams';
import { useTopicConsumerGroups } from 'lib/hooks/api/topics';
import { ColumnDef } from '@tanstack/react-table';
import Table, { LinkCell, TagCell } from 'components/common/NewTable';
import Search from 'components/common/Search/Search';
import { useTranslation } from 'components/contexts/LocaleContext';

import * as S from './TopicConsumerGroups.styled';

const TopicConsumerGroups: React.FC = () => {
  const { t } = useTranslation();
  const [keyword, setKeyword] = React.useState('');
  const { clusterName, topicName } = useAppParams<RouteParamsClusterTopic>();

  const { data = [] } = useTopicConsumerGroups({
    clusterName,
    topicName,
  });

  const consumerGroups = React.useMemo(
    () =>
      data.filter(
        (item) => item.groupId.toLocaleLowerCase().indexOf(keyword) > -1
      ),
    [data, keyword]
  );

  const columns = React.useMemo<ColumnDef<ConsumerGroup>[]>(
    () => [
      {
        header: t('topics.consumerGroups.table.groupId'),
        accessorKey: 'groupId',
        enableSorting: false,
        // eslint-disable-next-line react/no-unstable-nested-components
        cell: ({ row }) => (
          <LinkCell
            value={row.original.groupId}
            to={`${clusterConsumerGroupsPath(clusterName)}/${
              row.original.groupId
            }`}
          />
        ),
      },
      {
        header: t('topics.consumerGroups.table.activeConsumers'),
        accessorKey: 'members',
        enableSorting: false,
      },
      {
        header: t('consumerGroups.list.table.consumerLag'),
        accessorKey: 'consumerLag',
        enableSorting: false,
      },
      {
        header: t('topics.consumerGroups.table.coordinator'),
        accessorKey: 'coordinator',
        enableSorting: false,
        cell: ({ getValue }) => {
          const coordinator = getValue<ConsumerGroup['coordinator']>();
          if (coordinator === undefined) {
            return 0;
          }
          return coordinator.id;
        },
      },
      {
        header: t('consumerGroups.list.table.state'),
        accessorKey: 'state',
        enableSorting: false,
        cell: TagCell,
      },
    ],
    [clusterName, t]
  );
  return (
    <>
      <S.SearchWrapper>
        <Search
          onChange={setKeyword}
          placeholder={t('topics.consumerGroups.searchPlaceholder')}
          value={keyword}
        />
      </S.SearchWrapper>
      <Table
        columns={columns}
        data={consumerGroups}
        enableSorting
        emptyMessage={t('consumerGroups.list.table.empty')}
      />
    </>
  );
};

export default TopicConsumerGroups;
