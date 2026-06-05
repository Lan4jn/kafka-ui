import React from 'react';
import { Action, CleanUpPolicy, Topic, ResourceType } from 'generated-sources';
import { CellContext } from '@tanstack/react-table';
import ClusterContext from 'components/contexts/ClusterContext';
import { useTranslation } from 'components/contexts/LocaleContext';
import { ClusterNameRoute } from 'lib/paths';
import useAppParams from 'lib/hooks/useAppParams';
import { Dropdown, DropdownItemHint } from 'components/common/Dropdown';
import {
  useDeleteTopic,
  useClearTopicMessages,
  useRecreateTopic,
} from 'lib/hooks/api/topics';
import { ActionDropdownItem } from 'components/common/ActionComponent';

const ActionsCell: React.FC<CellContext<Topic, unknown>> = ({ row }) => {
  const { name, internal, cleanUpPolicy } = row.original;
  const { t } = useTranslation();

  const { isReadOnly, isTopicDeletionAllowed } =
    React.useContext(ClusterContext);
  const { clusterName } = useAppParams<ClusterNameRoute>();

  const clearMessages = useClearTopicMessages(clusterName);
  const deleteTopic = useDeleteTopic(clusterName);
  const recreateTopic = useRecreateTopic({ clusterName, topicName: name });

  const disabled = internal || isReadOnly;

  const clearTopicMessagesHandler = async () => {
    await clearMessages.mutateAsync(name);
  };

  const isCleanupDisabled = cleanUpPolicy !== CleanUpPolicy.DELETE;

  return (
    <Dropdown disabled={disabled}>
      <ActionDropdownItem
        disabled={isCleanupDisabled}
        onClick={clearTopicMessagesHandler}
        confirm={t('topics.confirmations.clearMessages')}
        danger
        permission={{
          resource: ResourceType.TOPIC,
          action: Action.MESSAGES_DELETE,
          value: name,
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
        disabled={!isTopicDeletionAllowed}
        onClick={recreateTopic.mutateAsync}
        confirm={
          <>
            {t('topics.details.confirmations.recreate.prefix')} <b>{name}</b>{' '}
            {t('topics.details.confirmations.recreate.suffix')}
          </>
        }
        danger
        permission={{
          resource: ResourceType.TOPIC,
          action: [Action.VIEW, Action.CREATE, Action.DELETE],
          value: name,
        }}
      >
        {t('topics.details.actions.recreate')}
      </ActionDropdownItem>
      <ActionDropdownItem
        disabled={!isTopicDeletionAllowed}
        onClick={() => deleteTopic.mutateAsync(name)}
        confirm={
          <>
            {t('topics.details.confirmations.remove.prefix')} <b>{name}</b>{' '}
            {t('topics.details.confirmations.remove.suffix')}
          </>
        }
        danger
        permission={{
          resource: ResourceType.TOPIC,
          action: Action.DELETE,
          value: name,
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
  );
};

export default ActionsCell;
