import React from 'react';
import * as C from 'components/common/Tag/Tag.styled';
import * as Metrics from 'components/common/Metrics';
import getTagColor from 'components/common/Tag/getTagColor';
import { RouterParamsClusterConnectConnector } from 'lib/paths';
import useAppParams from 'lib/hooks/useAppParams';
import { useConnector, useConnectorTasks } from 'lib/hooks/api/kafkaConnect';
import { useTranslation } from 'components/contexts/LocaleContext';

import getTaskMetrics from './getTaskMetrics';

const Overview: React.FC = () => {
  const { t } = useTranslation();
  const routerProps = useAppParams<RouterParamsClusterConnectConnector>();

  const { data: connector } = useConnector(routerProps);
  const { data: tasks } = useConnectorTasks(routerProps);

  if (!connector) {
    return null;
  }

  const { running, failed } = getTaskMetrics(tasks);

  return (
    <Metrics.Wrapper>
      <Metrics.Section>
        {connector.status?.workerId && (
          <Metrics.Indicator label={t('connect.overview.metrics.worker')}>
            {connector.status.workerId}
          </Metrics.Indicator>
        )}
        <Metrics.Indicator label={t('connect.overview.metrics.type')}>
          {connector.type}
        </Metrics.Indicator>
        {connector.config['connector.class'] && (
          <Metrics.Indicator label={t('connect.overview.metrics.class')}>
            {connector.config['connector.class']}
          </Metrics.Indicator>
        )}
        <Metrics.Indicator label={t('connect.overview.metrics.state')}>
          <C.Tag color={getTagColor(connector.status.state)}>
            {connector.status.state}
          </C.Tag>
        </Metrics.Indicator>
        <Metrics.Indicator label={t('connect.overview.metrics.tasksRunning')}>
          {running}
        </Metrics.Indicator>
        <Metrics.Indicator
          label={t('connect.overview.metrics.tasksFailed')}
          isAlert
          alertType={failed > 0 ? 'error' : 'success'}
        >
          {failed}
        </Metrics.Indicator>
      </Metrics.Section>
    </Metrics.Wrapper>
  );
};

export default Overview;
