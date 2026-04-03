import React from 'react';
import type { Partition, Replica } from 'generated-sources';
import BytesFormatted from 'components/common/BytesFormatted/BytesFormatted';
import Table from 'components/common/NewTable';
import * as Metrics from 'components/common/Metrics';
import { Tag } from 'components/common/Tag/Tag.styled';
import { RouteParamsClusterTopic } from 'lib/paths';
import useAppParams from 'lib/hooks/useAppParams';
import { useTopicDetails } from 'lib/hooks/api/topics';
import { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'components/contexts/LocaleContext';

import * as S from './Overview.styled';
import ActionsCell from './ActionsCell';

const Overview: React.FC = () => {
  const { clusterName, topicName } = useAppParams<RouteParamsClusterTopic>();
  const { data } = useTopicDetails({ clusterName, topicName });
  const { t } = useTranslation();

  const messageCount = React.useMemo(
    () =>
      (data?.partitions || []).reduce((memo, partition) => {
        return memo + partition.offsetMax - partition.offsetMin;
      }, 0),
    [data]
  );
  const newData = React.useMemo(() => {
    if (!data?.partitions) return [];

    return data.partitions.map((items: Partition) => {
      return {
        ...items,
        messageCount: items.offsetMax - items.offsetMin,
      };
    });
  }, [data?.partitions]);

  const columns = React.useMemo<ColumnDef<Partition>[]>(
    () => [
      {
        header: t('topics.overview.table.partitionId'),
        enableSorting: false,
        accessorKey: 'partition',
      },
      {
        header: t('topics.overview.table.replicas'),
        enableSorting: false,

        accessorKey: 'replicas',
        cell: ({ getValue }) => {
          const replicas = getValue<Partition['replicas']>();
          if (replicas === undefined || replicas.length === 0) {
            return 0;
          }
          return replicas?.map(({ broker, leader, inSync }: Replica) => (
            <S.Replica
              leader={leader}
              outOfSync={!inSync}
              key={broker}
              title={leader ? t('topics.overview.replica.leaderTitle') : ''}
            >
              {broker}
            </S.Replica>
          ));
        },
      },
      {
        header: t('topics.overview.table.firstOffset'),
        enableSorting: false,
        accessorKey: 'offsetMin',
      },
      {
        header: t('topics.overview.table.nextOffset'),
        enableSorting: false,
        accessorKey: 'offsetMax',
      },
      {
        header: t('topics.overview.table.messageCount'),
        enableSorting: false,
        accessorKey: `messageCount`,
      },
      {
        header: '',
        enableSorting: false,
        accessorKey: 'actions',
        cell: ActionsCell,
      },
    ],
    [t]
  );
  return (
    <>
      <Metrics.Wrapper>
        <Metrics.Section>
          <Metrics.Indicator label={t('topics.overview.metrics.partitions')}>
            {data?.partitionCount}
          </Metrics.Indicator>
          <Metrics.Indicator
            label={t('topics.overview.metrics.replicationFactor')}
          >
            {data?.replicationFactor}
          </Metrics.Indicator>
          <Metrics.Indicator
            label={t('topics.overview.metrics.urp')}
            title={t('topics.overview.metrics.urpTitle')}
            isAlert
            alertType={
              data?.underReplicatedPartitions === 0 ? 'success' : 'error'
            }
          >
            {data?.underReplicatedPartitions === 0 ? (
              <Metrics.LightText>
                {data?.underReplicatedPartitions}
              </Metrics.LightText>
            ) : (
              <Metrics.RedText>
                {data?.underReplicatedPartitions}
              </Metrics.RedText>
            )}
          </Metrics.Indicator>
          <Metrics.Indicator
            label={t('topics.overview.metrics.inSyncReplicas')}
            isAlert
            alertType={
              data?.inSyncReplicas === data?.replicas ? 'success' : 'error'
            }
          >
            {data?.inSyncReplicas &&
            data?.replicas &&
            data?.inSyncReplicas < data?.replicas ? (
              <Metrics.RedText>{data?.inSyncReplicas}</Metrics.RedText>
            ) : (
              data?.inSyncReplicas
            )}
            <Metrics.LightText>
              {t('common.metrics.currentOfTotal', {
                current: '',
                total: data?.replicas,
              })}
            </Metrics.LightText>
          </Metrics.Indicator>
          <Metrics.Indicator label={t('topics.overview.metrics.type')}>
            <Tag color="gray">
              {data?.internal
                ? t('topics.overview.type.internal')
                : t('topics.overview.type.external')}
            </Tag>
          </Metrics.Indicator>
          <Metrics.Indicator
            label={t('topics.overview.metrics.segmentSize')}
            title=""
          >
            <BytesFormatted value={data?.segmentSize} />
          </Metrics.Indicator>
          <Metrics.Indicator label={t('topics.overview.metrics.segmentCount')}>
            {data?.segmentCount}
          </Metrics.Indicator>
          <Metrics.Indicator label={t('topics.overview.metrics.cleanupPolicy')}>
            <Tag color="gray">
              {data?.cleanUpPolicy || t('topics.overview.cleanupPolicy.unknown')}
            </Tag>
          </Metrics.Indicator>
          <Metrics.Indicator label={t('topics.overview.metrics.messageCount')}>
            {messageCount}
          </Metrics.Indicator>
        </Metrics.Section>
      </Metrics.Wrapper>
      <Table
        columns={columns}
        data={newData}
        enableSorting
        emptyMessage={t('topics.overview.table.empty')}
      />
    </>
  );
};

export default Overview;
