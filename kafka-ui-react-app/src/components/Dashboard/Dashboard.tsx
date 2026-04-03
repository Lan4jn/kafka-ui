import React, { useMemo } from 'react';
import PageHeading from 'components/common/PageHeading/PageHeading';
import * as Metrics from 'components/common/Metrics';
import { Tag } from 'components/common/Tag/Tag.styled';
import Switch from 'components/common/Switch/Switch';
import { useClusters } from 'lib/hooks/api/clusters';
import { Cluster, ResourceType, ServerStatus } from 'generated-sources';
import { ColumnDef } from '@tanstack/react-table';
import Table, { SizeCell } from 'components/common/NewTable';
import useBoolean from 'lib/hooks/useBoolean';
import { clusterNewConfigPath } from 'lib/paths';
import { GlobalSettingsContext } from 'components/contexts/GlobalSettingsContext';
import { ActionCanButton } from 'components/common/ActionComponent';
import { useGetUserInfo } from 'lib/hooks/api/roles';
import { useTranslation } from 'components/contexts/LocaleContext';

import * as S from './Dashboard.styled';
import ClusterName from './ClusterName';
import ClusterTableActionsCell from './ClusterTableActionsCell';

const Dashboard: React.FC = () => {
  const { data } = useGetUserInfo();
  const clusters = useClusters();
  const { value: showOfflineOnly, toggle } = useBoolean(false);
  const appInfo = React.useContext(GlobalSettingsContext);
  const { t } = useTranslation();

  const config = React.useMemo(() => {
    const clusterList = clusters.data || [];
    const offlineClusters = clusterList.filter(
      ({ status }) => status === ServerStatus.OFFLINE
    );
    return {
      list: showOfflineOnly ? offlineClusters : clusterList,
      online: clusterList.length - offlineClusters.length,
      offline: offlineClusters.length,
    };
  }, [clusters, showOfflineOnly]);

  const columns = React.useMemo<ColumnDef<Cluster>[]>(() => {
    const initialColumns: ColumnDef<Cluster>[] = [
      {
        header: t('dashboard.table.clusterName'),
        accessorKey: 'name',
        cell: ClusterName,
      },
      { header: t('dashboard.table.version'), accessorKey: 'version' },
      {
        header: t('dashboard.table.brokersCount'),
        accessorKey: 'brokerCount',
      },
      {
        header: t('dashboard.table.partitions'),
        accessorKey: 'onlinePartitionCount',
      },
      { header: t('dashboard.table.topics'), accessorKey: 'topicCount' },
      {
        header: t('dashboard.table.production'),
        accessorKey: 'bytesInPerSec',
        cell: SizeCell,
      },
      {
        header: t('dashboard.table.consumption'),
        accessorKey: 'bytesOutPerSec',
        cell: SizeCell,
      },
    ];

    if (appInfo.hasDynamicConfig) {
      initialColumns.push({
        header: '',
        id: 'actions',
        cell: ClusterTableActionsCell,
      });
    }

    return initialColumns;
  }, [appInfo.hasDynamicConfig, t]);

  const hasPermissions = useMemo(() => {
    if (!data?.rbacEnabled) return true;
    return !!data?.userInfo?.permissions.some(
      (permission) => permission.resource === ResourceType.APPLICATIONCONFIG
    );
  }, [data]);
  return (
    <>
      <PageHeading text={t('dashboard.title')} />
      <Metrics.Wrapper>
        <Metrics.Section>
          <Metrics.Indicator
            label={<Tag color="green">{t('dashboard.metrics.online')}</Tag>}
          >
            <span>{config.online || 0}</span>{' '}
            <Metrics.LightText>
              {t('dashboard.metrics.clusters')}
            </Metrics.LightText>
          </Metrics.Indicator>
          <Metrics.Indicator
            label={<Tag color="gray">{t('dashboard.metrics.offline')}</Tag>}
          >
            <span>{config.offline || 0}</span>{' '}
            <Metrics.LightText>
              {t('dashboard.metrics.clusters')}
            </Metrics.LightText>
          </Metrics.Indicator>
        </Metrics.Section>
      </Metrics.Wrapper>
      <S.Toolbar>
        <div>
          <Switch
            name="switchRoundedDefault"
            checked={showOfflineOnly}
            onChange={toggle}
          />
          <label>{t('dashboard.filters.offlineOnly')}</label>
        </div>
        {appInfo.hasDynamicConfig && (
          <ActionCanButton
            buttonType="primary"
            buttonSize="M"
            to={clusterNewConfigPath}
            canDoAction={hasPermissions}
          >
            {t('dashboard.actions.configureNewCluster')}
          </ActionCanButton>
        )}
      </S.Toolbar>
      <Table
        columns={columns}
        data={config?.list}
        enableSorting
        emptyMessage={
          clusters.isFetched
            ? t('dashboard.table.empty')
            : t('dashboard.table.loading')
        }
      />
    </>
  );
};

export default Dashboard;
