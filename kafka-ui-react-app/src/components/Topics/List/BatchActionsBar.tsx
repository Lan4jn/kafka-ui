import React, { useMemo } from 'react';
import { Row } from '@tanstack/react-table';
import { Action, Topic, ResourceType } from 'generated-sources';
import useAppParams from 'lib/hooks/useAppParams';
import { ClusterName } from 'redux/interfaces';
import {
  topicKeys,
  useClearTopicMessages,
  useDeleteTopic,
} from 'lib/hooks/api/topics';
import { useConfirm } from 'lib/hooks/useConfirm';
import { clusterTopicCopyRelativePath } from 'lib/paths';
import { useQueryClient } from '@tanstack/react-query';
import { ActionCanButton } from 'components/common/ActionComponent';
import { isPermitted } from 'lib/permissions';
import { useUserInfo } from 'lib/hooks/useUserInfo';
import { useTranslation } from 'components/contexts/LocaleContext';

interface BatchActionsbarProps {
  rows: Row<Topic>[];
  resetRowSelection(): void;
}

const BatchActionsbar: React.FC<BatchActionsbarProps> = ({
  rows,
  resetRowSelection,
}) => {
  const { clusterName } = useAppParams<{ clusterName: ClusterName }>();
  const { t } = useTranslation();
  const confirm = useConfirm();
  const deleteTopic = useDeleteTopic(clusterName);
  const selectedTopics = rows.map(({ original }) => original.name);
  const client = useQueryClient();

  const clearMessages = useClearTopicMessages(clusterName);
  const clearTopicMessagesHandler = async (topicName: Topic['name']) => {
    await clearMessages.mutateAsync(topicName);
  };
  const deleteTopicsHandler = () => {
    confirm('Are you sure you want to remove selected topics?', async () => {
      try {
        await Promise.all(
          selectedTopics.map((topicName) => deleteTopic.mutateAsync(topicName))
        );
        resetRowSelection();
      } catch (e) {
        // do nothing;
      }
    });
  };

  const purgeTopicsHandler = () => {
    confirm(t('topics.confirmations.purgeSelectedTopics'), async () => {
      try {
        await Promise.all(
          selectedTopics.map((topicName) =>
            clearTopicMessagesHandler(topicName)
          )
        );
        resetRowSelection();
      } catch (e) {
        // do nothing;
      } finally {
        client.invalidateQueries(topicKeys.all(clusterName));
      }
    });
  };

  type Tuple = [string, string];

  const getCopyTopicPath = () => {
    if (!rows.length) {
      return {
        pathname: '',
        search: '',
      };
    }
    const topic = rows[0].original;

    const search = Object.keys(topic).reduce((acc: Tuple[], key) => {
      const value = topic[key as keyof typeof topic];
      if (!value || key === 'partitions' || key === 'internal') {
        return acc;
      }
      const tuple: Tuple = [key, value.toString()];
      return [...acc, tuple];
    }, []);

    return {
      pathname: clusterTopicCopyRelativePath,
      search: new URLSearchParams(search).toString(),
    };
  };
  const { roles, rbacFlag } = useUserInfo();

  const canDeleteSelectedTopics = useMemo(() => {
    return selectedTopics.every((value) =>
      isPermitted({
        roles,
        resource: ResourceType.TOPIC,
        action: Action.DELETE,
        value,
        clusterName,
        rbacFlag,
      })
    );
  }, [selectedTopics, clusterName, roles, rbacFlag]);

  const canCopySelectedTopic = useMemo(() => {
    return selectedTopics.every((value) =>
      isPermitted({
        roles,
        resource: ResourceType.TOPIC,
        action: Action.CREATE,
        value,
        clusterName,
        rbacFlag,
      })
    );
  }, [selectedTopics, clusterName, roles, rbacFlag]);

  const canPurgeSelectedTopics = useMemo(() => {
    return selectedTopics.every((value) =>
      isPermitted({
        roles,
        resource: ResourceType.TOPIC,
        action: Action.MESSAGES_DELETE,
        value,
        clusterName,
        rbacFlag,
      })
    );
  }, [selectedTopics, clusterName, roles, rbacFlag]);

  return (
    <>
      <ActionCanButton
        buttonSize="M"
        buttonType="secondary"
        onClick={deleteTopicsHandler}
        disabled={!selectedTopics.length}
        canDoAction={canDeleteSelectedTopics}
      >
        Delete selected topics
      </ActionCanButton>
      <ActionCanButton
        buttonSize="M"
        buttonType="secondary"
        disabled={selectedTopics.length !== 1}
        canDoAction={canCopySelectedTopic}
        to={getCopyTopicPath()}
      >
        Copy selected topic
      </ActionCanButton>
      <ActionCanButton
        buttonSize="M"
        buttonType="secondary"
        onClick={purgeTopicsHandler}
        disabled={!selectedTopics.length}
        canDoAction={canPurgeSelectedTopics}
      >
        {t('topics.actions.purgeSelectedTopics')}
      </ActionCanButton>
    </>
  );
};

export default BatchActionsbar;
