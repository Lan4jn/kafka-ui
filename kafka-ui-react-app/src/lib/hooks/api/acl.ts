import { aclApiClient as api } from 'lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClusterName } from 'redux/interfaces';
import { showSuccessAlert } from 'lib/errorHandling';
import { KafkaAcl } from 'generated-sources';
import { getCurrentLocale, translateMessage } from 'lib/i18n';

export function useAcls(clusterName: ClusterName) {
  return useQuery(
    ['clusters', clusterName, 'acls'],
    () => api.listAcls({ clusterName }),
    {
      suspense: false,
    }
  );
}

export function useCreateAclMutation(clusterName: ClusterName) {
  return useMutation(
    (data: KafkaAcl) =>
      api.createAcl({
        clusterName,
        kafkaAcl: data,
      }),
    {
      onSuccess() {
        showSuccessAlert({
          message: translateMessage(
            'acl.notifications.created',
            undefined,
            getCurrentLocale()
          ),
        });
      },
    }
  );
}

export function useCreateAcl(clusterName: ClusterName) {
  const mutate = useCreateAclMutation(clusterName);

  return {
    createResource: async (param: KafkaAcl) => {
      return mutate.mutateAsync(param);
    },
    ...mutate,
  };
}

export function useDeleteAclMutation(clusterName: ClusterName) {
  const queryClient = useQueryClient();
  return useMutation(
    (acl: KafkaAcl) => api.deleteAcl({ clusterName, kafkaAcl: acl }),
    {
      onSuccess: () => {
        showSuccessAlert({
          message: translateMessage(
            'acl.notifications.deleted',
            undefined,
            getCurrentLocale()
          ),
        });
        queryClient.invalidateQueries(['clusters', clusterName, 'acls']);
      },
    }
  );
}

export function useDeleteAcl(clusterName: ClusterName) {
  const mutate = useDeleteAclMutation(clusterName);

  return {
    deleteResource: async (param: KafkaAcl) => {
      return mutate.mutateAsync(param);
    },
    ...mutate,
  };
}
