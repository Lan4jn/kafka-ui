import { consumerGroupsApiClient as api } from 'lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClusterName } from 'redux/interfaces';
import {
  ConsumerGroup,
  ConsumerGroupOffsetsReset,
  ConsumerGroupOrdering,
  SortOrder,
} from 'generated-sources';
import { showSuccessAlert } from 'lib/errorHandling';
import { getCurrentLocale, translateMessage } from 'lib/i18n';

export type ConsumerGroupID = ConsumerGroup['groupId'];

type UseConsumerGroupsProps = {
  clusterName: ClusterName;
  orderBy?: ConsumerGroupOrdering;
  sortOrder?: SortOrder;
  page?: number;
  perPage?: number;
  search: string;
};

type UseConsumerGroupDetailsProps = {
  clusterName: ClusterName;
  consumerGroupID: ConsumerGroupID;
};

export function useConsumerGroups(props: UseConsumerGroupsProps) {
  const { clusterName, ...rest } = props;
  return useQuery(
    ['clusters', clusterName, 'consumerGroups', rest],
    () => api.getConsumerGroupsPage(props),
    { suspense: false, keepPreviousData: true }
  );
}

export function useConsumerGroupDetails(props: UseConsumerGroupDetailsProps) {
  const { clusterName, consumerGroupID } = props;
  return useQuery(
    ['clusters', clusterName, 'consumerGroups', consumerGroupID],
    () => api.getConsumerGroup({ clusterName, id: consumerGroupID })
  );
}

export const useDeleteConsumerGroupMutation = ({
  clusterName,
  consumerGroupID,
}: UseConsumerGroupDetailsProps) => {
  const queryClient = useQueryClient();
  return useMutation(
    () => api.deleteConsumerGroup({ clusterName, id: consumerGroupID }),
    {
      onSuccess: () => {
        showSuccessAlert({
          message: translateMessage(
            'consumerGroups.notifications.deleted',
            { consumerGroupID },
            getCurrentLocale()
          ),
        });
        queryClient.invalidateQueries([
          'clusters',
          clusterName,
          'consumerGroups',
        ]);
      },
    }
  );
};

export const useResetConsumerGroupOffsetsMutation = ({
  clusterName,
  consumerGroupID,
}: UseConsumerGroupDetailsProps) => {
  const queryClient = useQueryClient();
  return useMutation(
    (props: ConsumerGroupOffsetsReset) =>
      api.resetConsumerGroupOffsets({
        clusterName,
        id: consumerGroupID,
        consumerGroupOffsetsReset: props,
      }),
    {
      onSuccess: () => {
        showSuccessAlert({
          message: translateMessage(
            'consumerGroups.notifications.resetOffsets',
            { consumerGroupID },
            getCurrentLocale()
          ),
        });
        queryClient.invalidateQueries([
          'clusters',
          clusterName,
          'consumerGroups',
        ]);
      },
    }
  );
};
