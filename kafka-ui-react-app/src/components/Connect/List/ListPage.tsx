import React, { Suspense } from 'react';
import useAppParams from 'lib/hooks/useAppParams';
import { clusterConnectorNewRelativePath, ClusterNameRoute } from 'lib/paths';
import ClusterContext from 'components/contexts/ClusterContext';
import Search from 'components/common/Search/Search';
import * as Metrics from 'components/common/Metrics';
import PageHeading from 'components/common/PageHeading/PageHeading';
import { ActionButton } from 'components/common/ActionComponent';
import { ControlPanelWrapper } from 'components/common/ControlPanel/ControlPanel.styled';
import PageLoader from 'components/common/PageLoader/PageLoader';
import { Action, ConnectorState, ResourceType } from 'generated-sources';
import { useConnectors } from 'lib/hooks/api/kafkaConnect';
import { useTranslation } from 'components/contexts/LocaleContext';

import List from './List';

const ListPage: React.FC = () => {
  const { t } = useTranslation();
  const { isReadOnly } = React.useContext(ClusterContext);
  const { clusterName } = useAppParams<ClusterNameRoute>();

  // Fetches all connectors from the API, without search criteria. Used to display general metrics.
  const { data: connectorsMetrics, isLoading } = useConnectors(clusterName);

  const numberOfFailedConnectors = connectorsMetrics?.filter(
    ({ status: { state } }) => state === ConnectorState.FAILED
  ).length;

  const numberOfFailedTasks = connectorsMetrics?.reduce(
    (acc, metric) => acc + (metric.failedTasksCount ?? 0),
    0
  );

  return (
    <>
      <PageHeading text={t('connect.listPage.title')}>
        {!isReadOnly && (
          <ActionButton
            buttonType="primary"
            buttonSize="M"
            to={clusterConnectorNewRelativePath}
            permission={{
              resource: ResourceType.CONNECT,
              action: Action.CREATE,
            }}
          >
            {t('connect.listPage.actions.create')}
          </ActionButton>
        )}
      </PageHeading>
      <Metrics.Wrapper>
        <Metrics.Section>
          <Metrics.Indicator
            label={t('connect.listPage.metrics.connectors.label')}
            title={t('connect.listPage.metrics.connectors.title')}
            fetching={isLoading}
          >
            {connectorsMetrics?.length || '-'}
          </Metrics.Indicator>
          <Metrics.Indicator
            label={t('connect.listPage.metrics.failedConnectors.label')}
            title={t('connect.listPage.metrics.failedConnectors.title')}
            fetching={isLoading}
          >
            {numberOfFailedConnectors ?? '-'}
          </Metrics.Indicator>
          <Metrics.Indicator
            label={t('connect.listPage.metrics.failedTasks.label')}
            title={t('connect.listPage.metrics.failedTasks.title')}
            fetching={isLoading}
          >
            {numberOfFailedTasks ?? '-'}
          </Metrics.Indicator>
        </Metrics.Section>
      </Metrics.Wrapper>
      <ControlPanelWrapper hasInput>
        <Search placeholder={t('connect.listPage.searchPlaceholder')} />
      </ControlPanelWrapper>
      <Suspense fallback={<PageLoader />}>
        <List />
      </Suspense>
    </>
  );
};

export default ListPage;
