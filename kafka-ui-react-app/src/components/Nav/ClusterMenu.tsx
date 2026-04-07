import React from 'react';
import { Cluster, ClusterFeaturesEnum } from 'generated-sources';
import {
  clusterBrokersPath,
  clusterTopicsPath,
  clusterConsumerGroupsPath,
  clusterSchemasPath,
  clusterConnectorsPath,
  clusterKsqlDbPath,
  clusterACLPath,
} from 'lib/paths';
import { useTranslation } from 'components/contexts/LocaleContext';

import ClusterMenuItem from './ClusterMenuItem';
import ClusterTab from './ClusterTab/ClusterTab';
import * as S from './Nav.styled';

interface Props {
  cluster: Cluster;
  singleMode?: boolean;
}

const ClusterMenu: React.FC<Props> = ({
  cluster: { name, status, features },
  singleMode,
}) => {
  const { t } = useTranslation();
  const hasFeatureConfigured = (key: ClusterFeaturesEnum) =>
    features?.includes(key);
  const [isOpen, setIsOpen] = React.useState(!!singleMode);
  return (
    <S.List>
      <hr />
      <ClusterTab
        title={name}
        status={status}
        isOpen={isOpen}
        toggleClusterMenu={() => setIsOpen((prev) => !prev)}
      />
      {isOpen && (
        <S.List>
          <ClusterMenuItem
            to={clusterBrokersPath(name)}
            title={t('brokers.list.title')}
          />
          <ClusterMenuItem
            to={clusterTopicsPath(name)}
            title={t('topics.list.title')}
          />
          <ClusterMenuItem
            to={clusterConsumerGroupsPath(name)}
            title={t('consumerGroups.list.title')}
          />
          {hasFeatureConfigured(ClusterFeaturesEnum.SCHEMA_REGISTRY) && (
            <ClusterMenuItem
              to={clusterSchemasPath(name)}
              title={t('schemas.list.title')}
            />
          )}
          {hasFeatureConfigured(ClusterFeaturesEnum.KAFKA_CONNECT) && (
            <ClusterMenuItem
              to={clusterConnectorsPath(name)}
              title={t('connect.listPage.title')}
            />
          )}
          {hasFeatureConfigured(ClusterFeaturesEnum.KSQL_DB) && (
            <ClusterMenuItem
              to={clusterKsqlDbPath(name)}
              title={t('ksqlDb.title')}
            />
          )}
          {(hasFeatureConfigured(ClusterFeaturesEnum.KAFKA_ACL_VIEW) ||
            hasFeatureConfigured(ClusterFeaturesEnum.KAFKA_ACL_EDIT)) && (
            <ClusterMenuItem
              to={clusterACLPath(name)}
              title={t('acl.list.title')}
            />
          )}
        </S.List>
      )}
    </S.List>
  );
};

export default ClusterMenu;
