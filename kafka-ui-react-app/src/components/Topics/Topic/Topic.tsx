import React, { Suspense } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import {
  clusterTopicConsumerGroupsRelativePath,
  clusterTopicEditRelativePath,
  clusterTopicMessagesRelativePath,
  clusterTopicSettingsRelativePath,
  clusterTopicsPath,
  clusterTopicStatisticsRelativePath,
  RouteParamsClusterTopic,
} from 'lib/paths';
import ClusterContext from 'components/contexts/ClusterContext';
import { useTranslation } from 'components/contexts/LocaleContext';
import PageHeading from 'components/common/PageHeading/PageHeading';
import {
  ActionButton,
  ActionNavLink,
  ActionDropdownItem,
} from 'components/common/ActionComponent';
import Navbar from 'components/common/Navigation/Navbar.styled';
import { useAppDispatch } from 'lib/hooks/redux';
import useAppParams from 'lib/hooks/useAppParams';
import { Dropdown, DropdownItemHint } from 'components/common/Dropdown';
import {
  useClearTopicMessages,
  useDeleteTopic,
  useRecreateTopic,
  useTopicDetails,
} from 'lib/hooks/api/topics';
import { resetTopicMessages } from 'redux/reducers/topicMessages/topicMessagesSlice';
import { Action, CleanUpPolicy, ResourceType } from 'generated-sources';
import PageLoader from 'components/common/PageLoader/PageLoader';
import SlidingSidebar from 'components/common/SlidingSidebar';
import useBoolean from 'lib/hooks/useBoolean';

import Messages from './Messages/Messages';
import Overview from './Overview/Overview';
import Settings from './Settings/Settings';
import TopicConsumerGroups from './ConsumerGroups/TopicConsumerGroups';
import Statistics from './Statistics/Statistics';
import Edit from './Edit/Edit';
import SendMessage from './SendMessage/SendMessage';

const Topic: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    value: isSidebarOpen,
    setFalse: closeSidebar,
    setTrue: openSidebar,
  } = useBoolean(false);
  const { clusterName, topicName } = useAppParams<RouteParamsClusterTopic>();
  const { t } = useTranslation();

  const navigate = useNavigate();
  const deleteTopic = useDeleteTopic(clusterName);
  const recreateTopic = useRecreateTopic({ clusterName, topicName });
  const { data } = useTopicDetails({ clusterName, topicName });

  const { isReadOnly, isTopicDeletionAllowed } =
    React.useContext(ClusterContext);

  const deleteTopicHandler = async () => {
    await deleteTopic.mutateAsync(topicName);
    navigate(clusterTopicsPath(clusterName));
  };

  React.useEffect(() => {
    return () => {
      dispatch(resetTopicMessages());
    };
  }, []);
  const clearMessages = useClearTopicMessages(clusterName);
  const clearTopicMessagesHandler = async () => {
    await clearMessages.mutateAsync(topicName);
  };
  const canCleanup = data?.cleanUpPolicy === CleanUpPolicy.DELETE;
  return (
    <>
      <PageHeading
        text={topicName}
        backText={t('topics.list.title')}
        backTo={clusterTopicsPath(clusterName)}
      >
        <ActionButton
          buttonSize="M"
          buttonType="primary"
          onClick={openSidebar}
          disabled={isReadOnly}
          permission={{
            resource: ResourceType.TOPIC,
            action: Action.MESSAGES_PRODUCE,
            value: topicName,
          }}
        >
          {t('topics.sendMessage.actions.submit')}
        </ActionButton>
        <Dropdown disabled={isReadOnly || data?.internal}>
          <ActionDropdownItem
            onClick={() => navigate(clusterTopicEditRelativePath)}
            permission={{
              resource: ResourceType.TOPIC,
              action: Action.EDIT,
              value: topicName,
            }}
          >
            {t('topics.details.actions.editSettings')}
            <DropdownItemHint>
              {t('topics.details.hints.editSettings.line1')}
              <br />
              {t('topics.details.hints.editSettings.line2')}
            </DropdownItemHint>
          </ActionDropdownItem>

          <ActionDropdownItem
            onClick={clearTopicMessagesHandler}
            confirm={t('topics.confirmations.clearMessages')}
            disabled={!canCleanup}
            danger
            permission={{
              resource: ResourceType.TOPIC,
              action: Action.MESSAGES_DELETE,
              value: topicName,
            }}
          >
            {t('topics.actions.clearMessages')}
            <DropdownItemHint>
              {t('topics.details.hints.clearMessages.line1')}
              <br />
              {t('topics.details.hints.clearMessages.line2')}
            </DropdownItemHint>
          </ActionDropdownItem>

          <ActionDropdownItem
            onClick={recreateTopic.mutateAsync}
            confirm={
              <>
                {t('topics.details.confirmations.recreate.prefix')}{' '}
                <b>{topicName}</b>{' '}
                {t('topics.details.confirmations.recreate.suffix')}
              </>
            }
            danger
            permission={{
              resource: ResourceType.TOPIC,
              action: [Action.MESSAGES_READ, Action.CREATE, Action.DELETE],
              value: topicName,
            }}
          >
            {t('topics.details.actions.recreate')}
          </ActionDropdownItem>
          <ActionDropdownItem
            onClick={deleteTopicHandler}
            confirm={
              <>
                {t('topics.details.confirmations.remove.prefix')}{' '}
                <b>{topicName}</b>{' '}
                {t('topics.details.confirmations.remove.suffix')}
              </>
            }
            disabled={!isTopicDeletionAllowed}
            danger
            permission={{
              resource: ResourceType.TOPIC,
              action: Action.DELETE,
              value: topicName,
            }}
          >
            {t('topics.details.actions.remove')}
            {!isTopicDeletionAllowed && (
              <DropdownItemHint>
                {t('topics.details.hints.removeDisabled.line1')}
                <br />
                {t('topics.details.hints.removeDisabled.line2')}
              </DropdownItemHint>
            )}
          </ActionDropdownItem>
        </Dropdown>
      </PageHeading>
      <Navbar role="navigation">
        <NavLink
          to="."
          className={({ isActive }) => (isActive ? 'is-active' : '')}
          end
        >
          {t('topics.tabs.overview')}
        </NavLink>
        <ActionNavLink
          to={clusterTopicMessagesRelativePath}
          className={({ isActive }) => (isActive ? 'is-active' : '')}
          permission={{
            resource: ResourceType.TOPIC,
            action: Action.MESSAGES_READ,
            value: topicName,
          }}
        >
          {t('topics.tabs.messages')}
        </ActionNavLink>
        <NavLink
          to={clusterTopicConsumerGroupsRelativePath}
          className={({ isActive }) => (isActive ? 'is-active' : '')}
        >
          {t('topics.tabs.consumers')}
        </NavLink>
        <NavLink
          to={clusterTopicSettingsRelativePath}
          className={({ isActive }) => (isActive ? 'is-active' : '')}
        >
          {t('topics.tabs.settings')}
        </NavLink>
        <NavLink
          to={clusterTopicStatisticsRelativePath}
          className={({ isActive }) => (isActive ? 'is-active' : '')}
        >
          {t('topics.tabs.statistics')}
        </NavLink>
      </Navbar>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<Overview />} />
          <Route
            path={clusterTopicMessagesRelativePath}
            element={<Messages />}
          />
          <Route
            path={clusterTopicSettingsRelativePath}
            element={<Settings />}
          />
          <Route
            path={clusterTopicConsumerGroupsRelativePath}
            element={<TopicConsumerGroups />}
          />
          <Route
            path={clusterTopicStatisticsRelativePath}
            element={<Statistics />}
          />
          <Route path={clusterTopicEditRelativePath} element={<Edit />} />
        </Routes>
      </Suspense>
      <SlidingSidebar
        open={isSidebarOpen}
        onClose={closeSidebar}
        title={t('topics.sendMessage.actions.submit')}
      >
        <Suspense fallback={<PageLoader />}>
          <SendMessage closeSidebar={closeSidebar} />
        </Suspense>
      </SlidingSidebar>
    </>
  );
};

export default Topic;
