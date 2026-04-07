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
import GlossaryTerm from 'components/common/GlossaryTerm';
import { GLOSSARY_TERMS } from 'lib/glossaryTerms';

import * as S from './Overview.styled';
import ActionsCell from './ActionsCell';

const Overview: React.FC = () => {
  const { clusterName, topicName } = useAppParams<RouteParamsClusterTopic>();
  const { data } = useTopicDetails({ clusterName, topicName });

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
        header: (
          <GlossaryTerm english={GLOSSARY_TERMS.PARTITION}>
            Partition ID
          </GlossaryTerm>
        ),
        enableSorting: false,
        accessorKey: 'partition',
      },
      {
        header: 'Replicas',
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
              title={leader ? 'Leader' : ''}
            >
              {broker}
            </S.Replica>
          ));
        },
      },
      {
        header: (
          <GlossaryTerm english={GLOSSARY_TERMS.OFFSET}>
            First Offset
          </GlossaryTerm>
        ),
        enableSorting: false,
        accessorKey: 'offsetMin',
      },
      {
        header: (
          <GlossaryTerm english={GLOSSARY_TERMS.OFFSET}>
            Next Offset
          </GlossaryTerm>
        ),
        enableSorting: false,
        accessorKey: 'offsetMax',
      },
      {
        header: 'Message Count',
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
    []
  );
  return (
    <>
      <Metrics.Wrapper>
        <Metrics.Section>
          <Metrics.Indicator
            label={
              <GlossaryTerm english={GLOSSARY_TERMS.PARTITION}>
                Partitions
              </GlossaryTerm>
            }
          >
            {data?.partitionCount}
          </Metrics.Indicator>
          <Metrics.Indicator
            label={
              <GlossaryTerm english={GLOSSARY_TERMS.REPLICATION_FACTOR}>
                Replication Factor
              </GlossaryTerm>
            }
          >
            {data?.replicationFactor}
          </Metrics.Indicator>
          <Metrics.Indicator
            label="URP"
            title="Under replicated partitions"
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
            label={
              <GlossaryTerm english={GLOSSARY_TERMS.ISR}>
                In Sync Replicas
              </GlossaryTerm>
            }
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
            <Metrics.LightText> of {data?.replicas}</Metrics.LightText>
          </Metrics.Indicator>
          <Metrics.Indicator label="Type">
            <Tag color="gray">{data?.internal ? 'Internal' : 'External'}</Tag>
          </Metrics.Indicator>
          <Metrics.Indicator
            label={
              <GlossaryTerm english={GLOSSARY_TERMS.SEGMENT}>
                Segment Size
              </GlossaryTerm>
            }
            title=""
          >
            <BytesFormatted value={data?.segmentSize} />
          </Metrics.Indicator>
          <Metrics.Indicator
            label={
              <GlossaryTerm english={GLOSSARY_TERMS.SEGMENT}>
                Segment Count
              </GlossaryTerm>
            }
          >
            {data?.segmentCount}
          </Metrics.Indicator>
          <Metrics.Indicator label="Clean Up Policy">
            <Tag color="gray">{data?.cleanUpPolicy || 'Unknown'}</Tag>
          </Metrics.Indicator>
          <Metrics.Indicator label="Message Count">
            {messageCount}
          </Metrics.Indicator>
        </Metrics.Section>
      </Metrics.Wrapper>
      <Table
        columns={columns}
        data={newData}
        enableSorting
        emptyMessage="No Partitions found "
      />
    </>
  );
};

export default Overview;
