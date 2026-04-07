import React from 'react';
import { ClusterName } from 'redux/interfaces';
import { useNavigate } from 'react-router-dom';
import PageHeading from 'components/common/PageHeading/PageHeading';
import * as Metrics from 'components/common/Metrics';
import useAppParams from 'lib/hooks/useAppParams';
import { useBrokers } from 'lib/hooks/api/brokers';
import { useClusterStats } from 'lib/hooks/api/clusters';
import Table, { LinkCell, SizeCell } from 'components/common/NewTable';
import CheckMarkRoundIcon from 'components/common/Icons/CheckMarkRoundIcon';
import { ColumnDef } from '@tanstack/react-table';
import { clusterBrokerPath } from 'lib/paths';
import Tooltip from 'components/common/Tooltip/Tooltip';
import GlossaryTerm from 'components/common/GlossaryTerm';
import ColoredCell from 'components/common/NewTable/ColoredCell';
import { useTranslation } from 'components/contexts/LocaleContext';
import { GLOSSARY_TERMS } from 'lib/glossaryTerms';

import SkewHeader from './SkewHeader/SkewHeader';
import * as S from './BrokersList.styled';

const NA = 'N/A';

const BrokersList: React.FC = () => {
  const navigate = useNavigate();
  const { clusterName } = useAppParams<{ clusterName: ClusterName }>();
  const { t } = useTranslation();
  const { data: clusterStats = {} } = useClusterStats(clusterName);
  const { data: brokers } = useBrokers(clusterName);

  const {
    brokerCount,
    activeControllers,
    onlinePartitionCount,
    offlinePartitionCount,
    inSyncReplicasCount,
    outOfSyncReplicasCount,
    underReplicatedPartitionCount,
    diskUsage,
    version,
  } = clusterStats;

  const rows = React.useMemo(() => {
    let brokersResource;
    if (!diskUsage || !diskUsage?.length) {
      brokersResource =
        brokers?.map((broker) => {
          return {
            brokerId: broker.id,
            segmentSize: NA,
            segmentCount: NA,
          };
        }) || [];
    } else {
      brokersResource = diskUsage;
    }

    return brokersResource.map(({ brokerId, segmentSize, segmentCount }) => {
      const broker = brokers?.find(({ id }) => id === brokerId);
      return {
        brokerId,
        size: segmentSize || NA,
        count: segmentCount || NA,
        port: broker?.port,
        host: broker?.host,
        partitionsLeader: broker?.partitionsLeader,
        partitionsSkew: broker?.partitionsSkew,
        leadersSkew: broker?.leadersSkew,
        inSyncPartitions: broker?.inSyncPartitions,
      };
    });
  }, [diskUsage, brokers]);

  const columns = React.useMemo<ColumnDef<(typeof rows)[number]>[]>(
    () => [
      {
        header: (
          <GlossaryTerm english={GLOSSARY_TERMS.BROKER}>
            {t('brokers.list.table.brokerId')}
          </GlossaryTerm>
        ),
        accessorKey: 'brokerId',
        // eslint-disable-next-line react/no-unstable-nested-components
        cell: ({ getValue }) => (
          <S.RowCell>
            <LinkCell
              value={`${getValue<string | number>()}`}
              to={encodeURIComponent(`${getValue<string | number>()}`)}
            />
            {getValue<string | number>() === activeControllers && (
              <Tooltip
                value={<CheckMarkRoundIcon />}
                content={t('brokers.list.table.activeController')}
                placement="right"
              />
            )}
          </S.RowCell>
        ),
      },
      {
        header: t('brokers.list.table.diskUsage'),
        accessorKey: 'size',
        // eslint-disable-next-line react/no-unstable-nested-components
        cell: ({ getValue, table, cell, column, renderValue, row }) =>
          getValue() === NA ? (
            NA
          ) : (
            <SizeCell
              table={table}
              column={column}
              row={row}
              cell={cell}
              getValue={getValue}
              renderValue={renderValue}
              renderSegments
              precision={2}
            />
          ),
      },
      {
        // eslint-disable-next-line react/no-unstable-nested-components
        header: () => <SkewHeader />,
        accessorKey: 'partitionsSkew',
        // eslint-disable-next-line react/no-unstable-nested-components
        cell: ({ getValue }) => {
          const value = getValue<number>();
          return (
            <ColoredCell
              value={value ? `${value.toFixed(2)}%` : '-'}
              warn={value >= 10 && value < 20}
              attention={value >= 20}
            />
          );
        },
      },
      {
        header: t('brokers.list.table.leaders'),
        accessorKey: 'partitionsLeader',
      },
      {
        header: t('brokers.list.table.leaderSkew'),
        accessorKey: 'leadersSkew',
        // eslint-disable-next-line react/no-unstable-nested-components
        cell: ({ getValue }) => {
          const value = getValue<number>();
          return (
            <ColoredCell
              value={value ? `${value.toFixed(2)}%` : '-'}
              warn={value >= 10 && value < 20}
              attention={value >= 20}
            />
          );
        },
      },
      {
        header: t('brokers.list.table.onlinePartitions'),
        accessorKey: 'inSyncPartitions',
        // eslint-disable-next-line react/no-unstable-nested-components
        cell: ({ getValue, row }) => {
          const value = getValue<number>();
          return (
            <ColoredCell
              value={value}
              attention={value !== row.original.count}
            />
          );
        },
      },
      { header: t('brokers.list.table.port'), accessorKey: 'port' },
      {
        header: t('brokers.list.table.host'),
        accessorKey: 'host',
      },
    ],
    [activeControllers, t]
  );

  const replicas = (inSyncReplicasCount ?? 0) + (outOfSyncReplicasCount ?? 0);
  const areAllInSync = inSyncReplicasCount && replicas === inSyncReplicasCount;
  const partitionIsOffline = offlinePartitionCount && offlinePartitionCount > 0;

  const isActiveControllerUnKnown = typeof activeControllers === 'undefined';

  return (
    <>
      <PageHeading text={t('brokers.list.title')} />
      <Metrics.Wrapper>
        <Metrics.Section title={t('brokers.list.metrics.uptime')}>
          <Metrics.Indicator
            label={
              <GlossaryTerm english={GLOSSARY_TERMS.BROKER}>
                {t('brokers.list.metrics.brokerCount')}
              </GlossaryTerm>
            }
          >
            {brokerCount}
          </Metrics.Indicator>
          <Metrics.Indicator
            label={t('brokers.list.metrics.activeController')}
            isAlert={isActiveControllerUnKnown}
          >
            {isActiveControllerUnKnown ? (
              <S.DangerText>
                {t('brokers.list.metrics.noActiveController')}
              </S.DangerText>
            ) : (
              activeControllers
            )}
          </Metrics.Indicator>
          <Metrics.Indicator label={t('brokers.list.metrics.version')}>
            {version}
          </Metrics.Indicator>
        </Metrics.Section>
        <Metrics.Section
          title={
            <GlossaryTerm english={GLOSSARY_TERMS.PARTITION}>
              {t('brokers.list.metrics.partitions')}
            </GlossaryTerm>
          }
        >
          <Metrics.Indicator
            label={t('brokers.list.metrics.online')}
            isAlert
            alertType={partitionIsOffline ? 'error' : 'success'}
          >
            {partitionIsOffline ? (
              <Metrics.RedText>{onlinePartitionCount}</Metrics.RedText>
            ) : (
              onlinePartitionCount
            )}
            <Metrics.LightText>
              {t('common.metrics.currentOfTotal', {
                current: '',
                total:
                  (onlinePartitionCount || 0) + (offlinePartitionCount || 0),
              })}
            </Metrics.LightText>
          </Metrics.Indicator>
          <Metrics.Indicator
            label={t('brokers.list.metrics.urp')}
            title={t('brokers.list.metrics.urpTitle')}
            isAlert
            alertType={!underReplicatedPartitionCount ? 'success' : 'error'}
          >
            {!underReplicatedPartitionCount ? (
              <Metrics.LightText>
                {underReplicatedPartitionCount}
              </Metrics.LightText>
            ) : (
              <Metrics.RedText>{underReplicatedPartitionCount}</Metrics.RedText>
            )}
          </Metrics.Indicator>
          <Metrics.Indicator
            label={
              <GlossaryTerm english={GLOSSARY_TERMS.ISR}>
                {t('brokers.list.metrics.inSyncReplicas')}
              </GlossaryTerm>
            }
            isAlert
            alertType={areAllInSync ? 'success' : 'error'}
          >
            {areAllInSync ? (
              replicas
            ) : (
              <Metrics.RedText>{inSyncReplicasCount}</Metrics.RedText>
            )}
            <Metrics.LightText>
              {t('common.metrics.currentOfTotal', {
                current: '',
                total: replicas,
              })}
            </Metrics.LightText>
          </Metrics.Indicator>
          <Metrics.Indicator
            label={t('brokers.list.metrics.outOfSyncReplicas')}
          >
            {outOfSyncReplicasCount}
          </Metrics.Indicator>
        </Metrics.Section>
      </Metrics.Wrapper>
      <Table
        columns={columns}
        data={rows}
        enableSorting
        onRowClick={({ original: { brokerId } }) =>
          navigate(clusterBrokerPath(clusterName, brokerId))
        }
        emptyMessage={t('brokers.list.empty')}
      />
    </>
  );
};

export default BrokersList;
