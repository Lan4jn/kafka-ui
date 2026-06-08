import {
  CreateUserRequest,
  DeleteUserRequest,
  ResetUserPasswordOperationRequest,
  SetUserEnabledOperationRequest,
} from 'generated-sources';
import { usersApiClient as api } from 'lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const usersQueryKey = ['users'];

export function useUsers() {
  return useQuery(usersQueryKey, () => api.getUsers());
}

export function useCreateUser() {
  const client = useQueryClient();
  return useMutation(
    (createUserRequest: CreateUserRequest) =>
      api.createUser({ createUserRequest }),
    { onSuccess: () => client.invalidateQueries(usersQueryKey) }
  );
}

export function useSetUserEnabled() {
  const client = useQueryClient();
  return useMutation(
    ({ id, enabled }: { id: number; enabled: boolean }) =>
      api.setUserEnabled({ id, setUserEnabledRequest: { enabled } }),
    { onSuccess: () => client.invalidateQueries(usersQueryKey) }
  );
}

export function useResetUserPassword() {
  const client = useQueryClient();
  return useMutation(
    ({ id, password }: { id: number; password: string }) =>
      api.resetUserPassword({ id, resetUserPasswordRequest: { password } }),
    { onSuccess: () => client.invalidateQueries(usersQueryKey) }
  );
}

export function useDeleteUser() {
  const client = useQueryClient();
  return useMutation((request: DeleteUserRequest) => api.deleteUser(request), {
    onSuccess: () => client.invalidateQueries(usersQueryKey),
  });
}

export type ResetPasswordRequest = ResetUserPasswordOperationRequest;
export type SetEnabledRequest = SetUserEnabledOperationRequest;
