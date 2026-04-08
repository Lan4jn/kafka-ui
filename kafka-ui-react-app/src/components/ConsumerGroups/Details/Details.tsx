import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAppParams from 'lib/hooks/useAppParams';
import {
  clusterConsumerGroupResetRelativePath,
  clusterConsumerGroupsPath,
  ClusterGroupParam,
} from 'lib/paths';
import Search from 'components/common/Search/Search';
import ClusterContext from 'components/contexts/ClusterContext';
import PageHeading from 'components/common/PageHeading/PageHeading';
import * as Metrics from 'components/common/Metrics';
import { Tag } from 'components/common/Tag/Tag.styled';
import groupBy from 'lodash/groupBy';
import { Table } from 'components/common/table/Table/Table.styled';
import getTagColor from 'components/common/Tag/getTagColor';
import { Dropdown } from 'components/common/Dropdown';
import { ControlPanelWrapper } from 'components/common/ControlPanel/ControlPanel.styled';
import { Action, ConsumerGroupState, ResourceType } from 'generated-sources';
import { ActionDropdownItem } from 'components/common/ActionComponent';
import TableHeaderCell from 'components/common/table/TableHeaderCell/TableHeaderCell';
import {
  useConsumerGroupDetails,
  useDeleteConsumerGroupMutation,
} from 'lib/hooks/api/consumers';
import Tooltip from 'components/common/Tooltip/Tooltip';
import { CONSUMER_GROUP_STATE_TOOLTIPS } from 'lib/constants';
import { useTranslation } from 'components/contexts/LocaleContext';

import ListItem from './ListItem';

const Details: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchValue = searchParams.get('q') || '';
  const { isReadOnly } = React.useContext(ClusterContext);
  const routeParams = useAppParams<ClusterGroupParam>();
  const { clusterName, consumerGroupID } = routeParams;

  const consumerGroup = useConsumerGroupDetails(routeParams);
  const deleteConsumerGroup = useDeleteConsumerGroupMutation(routeParams);

  const onDelete = async () => {
    await deleteConsumerGroup.mutateAsync();
    navigate('../');
  };

  const onResetOffsets = () => {
    navigate(clusterConsumerGroupResetRelativePath);
  };

  const partitionsByTopic = groupBy(consumerGroup.data?.partitions, 'topic');
  const filteredPartitionsByTopic = Object.keys(partitionsByTopic).filter(
    (el) => el.includes(searchValue)
  );
  const currentPartitionsByTopic = searchValue.length
    ? filteredPartitionsByTopic
    : Object.keys(partitionsByTopic);

  const hasAssignedTopics = consumerGroup?.data?.topics !== 0;
  const stateTooltipKey =
    CONSUMER_GROUP_STATE_TOOLTIPS[
      consumerGroup.data?.state || ConsumerGroupState.UNKNOWN
    ];

  return (
    <div>
      <div>
        <PageHeading
          text={consumerGroupID}
          backTo={clusterConsumerGroupsPath(clusterName)}
          backText={t('consumerGroups.list.title')}
        >
          {!isReadOnly && (
            <Dropdown>
              <ActionDropdownItem
                onClick={onResetOffsets}
                permission={{
                  resource: ResourceType.CONSUMER,
                  action: Action.RESET_OFFSETS,
                  value: consumerGroupID,
                }}
                disabled={!hasAssignedTopics}
              >
                {t('consumerGroups.details.actions.resetOffsets')}
              </ActionDropdownItem>
              <ActionDropdownItem
                confirm={t('consumerGroups.details.confirmDelete')}
                onClick={onDelete}
                danger
                permission={{
                  resource: ResourceType.CONSUMER,
                  action: Action.DELETE,
                  value: consumerGroupID,
                }}
              >
                {t('consumerGroups.details.actions.delete')}
              </ActionDropdownItem>
            </Dropdown>
          )}
        </PageHeading>
      </div>
      <Metrics.Wrapper>
        <Metrics.Section>
          <Metrics.Indicator label={t('consumerGroups.list.table.state')}>
            <Tooltip
              value={
                <Tag color={getTagColor(consumerGroup.data?.state)}>
                  {consumerGroup.data?.state}
                </Tag>
              }
              content={
                stateTooltipKey ? t(stateTooltipKey) : ''
              }
              placement="bottom-start"
            />
          </Metrics.Indicator>
          <Metrics.Indicator label={t('consumerGroups.list.table.members')}>
            {consumerGroup.data?.members}
          </Metrics.Indicator>
          <Metrics.Indicator
            label={t('consumerGroups.details.metrics.assignedTopics')}
          >
            {consumerGroup.data?.topics}
          </Metrics.Indicator>
          <Metrics.Indicator
            label={t('consumerGroups.details.metrics.assignedPartitions')}
          >
            {consumerGroup.data?.partitions?.length}
          </Metrics.Indicator>
          <Metrics.Indicator
            label={t('consumerGroups.details.metrics.coordinatorId')}
          >
            {consumerGroup.data?.coordinator?.id}
          </Metrics.Indicator>
          <Metrics.Indicator
            label={t('consumerGroups.details.metrics.totalLag')}
          >
            {consumerGroup.data?.consumerLag}
          </Metrics.Indicator>
        </Metrics.Section>
      </Metrics.Wrapper>
      <ControlPanelWrapper hasInput style={{ margin: '16px 0 20px' }}>
        <Search placeholder={t('topics.list.searchPlaceholder')} />
      </ControlPanelWrapper>
      <Table isFullwidth>
        <thead>
          <tr>
            <TableHeaderCell title={t('consumerGroups.details.table.topic')} />
            <TableHeaderCell
              title={t('consumerGroups.list.table.consumerLag')}
            />
          </tr>
        </thead>
        <tbody>
          {currentPartitionsByTopic.map((key) => (
            <ListItem
              clusterName={clusterName}
              consumers={partitionsByTopic[key]}
              name={key}
              key={key}
            />
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default Details;
