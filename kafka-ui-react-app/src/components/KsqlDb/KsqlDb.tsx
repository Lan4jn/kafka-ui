import React from 'react';
import Query from 'components/KsqlDb/Query/Query';
import useAppParams from 'lib/hooks/useAppParams';
import * as Metrics from 'components/common/Metrics';
import {
  clusterKsqlDbQueryRelativePath,
  clusterKsqlDbStreamsPath,
  clusterKsqlDbStreamsRelativePath,
  clusterKsqlDbTablesPath,
  clusterKsqlDbTablesRelativePath,
  ClusterNameRoute,
} from 'lib/paths';
import PageHeading from 'components/common/PageHeading/PageHeading';
import { ActionButton } from 'components/common/ActionComponent';
import Navbar from 'components/common/Navigation/Navbar.styled';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { Action, ResourceType } from 'generated-sources';
import { useKsqlkDb } from 'lib/hooks/api/ksqlDb';
import 'ace-builds/src-noconflict/ace';
import { useTranslation } from 'components/contexts/LocaleContext';

import TableView from './TableView';

const KsqlDb: React.FC = () => {
  const { t } = useTranslation();
  const { clusterName } = useAppParams<ClusterNameRoute>();

  const [tables, streams] = useKsqlkDb(clusterName);

  const isFetching = tables.isFetching || streams.isFetching;

  return (
    <>
      <PageHeading text={t('ksqlDb.title')}>
        <ActionButton
          to={clusterKsqlDbQueryRelativePath}
          buttonType="primary"
          buttonSize="M"
          permission={{
            resource: ResourceType.KSQL,
            action: Action.EXECUTE,
          }}
        >
          {t('ksqlDb.actions.execute')}
        </ActionButton>
      </PageHeading>
      <Metrics.Wrapper>
        <Metrics.Section>
          <Metrics.Indicator
            label={t('ksqlDb.metrics.tables')}
            title={t('ksqlDb.metrics.tables')}
            fetching={isFetching}
          >
            {tables.isSuccess ? tables.data.length : '-'}
          </Metrics.Indicator>
          <Metrics.Indicator
            label={t('ksqlDb.metrics.streams')}
            title={t('ksqlDb.metrics.streams')}
            fetching={isFetching}
          >
            {streams.isSuccess ? streams.data.length : '-'}
          </Metrics.Indicator>
        </Metrics.Section>
      </Metrics.Wrapper>
      <div>
        <Navbar role="navigation">
          <NavLink
            to={clusterKsqlDbTablesPath(clusterName)}
            className={({ isActive }) => (isActive ? 'is-active' : '')}
            end
          >
            {t('ksqlDb.tabs.tables')}
          </NavLink>
          <NavLink
            to={clusterKsqlDbStreamsPath(clusterName)}
            className={({ isActive }) => (isActive ? 'is-active' : '')}
            end
          >
            {t('ksqlDb.tabs.streams')}
          </NavLink>
        </Navbar>
        <Routes>
          <Route
            index
            element={<Navigate to={clusterKsqlDbTablesRelativePath} />}
          />
          <Route
            path={clusterKsqlDbTablesRelativePath}
            element={
              <TableView
                fetching={tables.isFetching}
                rows={tables.data || []}
              />
            }
          />
          <Route
            path={clusterKsqlDbStreamsRelativePath}
            element={
              <TableView
                fetching={streams.isFetching}
                rows={streams.data || []}
              />
            }
          />
          <Route path={clusterKsqlDbQueryRelativePath} element={<Query />} />
        </Routes>
      </div>
    </>
  );
};

export default KsqlDb;
