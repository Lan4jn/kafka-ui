import React from 'react';
import PageHeading from 'components/common/PageHeading/PageHeading';
import { Button } from 'components/common/Button/Button';
import Table from 'components/common/NewTable';
import { User } from 'generated-sources';
import {
  useCreateUser,
  useDeleteUser,
  useResetUserPassword,
  useSetUserEnabled,
  useUsers,
} from 'lib/hooks/api/users';
import { useTranslation } from 'components/contexts/LocaleContext';
import { ColumnDef } from '@tanstack/react-table';

interface UserActionsProps {
  user: User;
  onDelete: (id: number) => void;
  onResetPassword: (id: number, password: string) => void;
  onSetEnabled: (id: number, enabled: boolean) => void;
}

const UserActions: React.FC<UserActionsProps> = ({
  user,
  onDelete,
  onResetPassword,
  onSetEnabled,
}) => {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = React.useState('');

  return (
    <div>
      <Button
        aria-label={
          user.enabled
            ? t('users.actions.disableUser', { username: user.username })
            : t('users.actions.enableUser', { username: user.username })
        }
        buttonSize="M"
        buttonType="secondary"
        onClick={() => onSetEnabled(user.id, !user.enabled)}
      >
        {user.enabled ? t('users.actions.disable') : t('users.actions.enable')}
      </Button>
      <label>
        {t('users.fields.newPasswordFor', { username: user.username })}
        <input
          aria-label={t('users.fields.newPasswordFor', {
            username: user.username,
          })}
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </label>
      <Button
        aria-label={t('users.actions.resetPasswordFor', {
          username: user.username,
        })}
        buttonSize="M"
        buttonType="secondary"
        disabled={!newPassword}
        onClick={() => onResetPassword(user.id, newPassword)}
      >
        {t('users.actions.resetPassword')}
      </Button>
      <Button
        aria-label={t('users.actions.deleteUser', { username: user.username })}
        buttonSize="M"
        buttonType="secondary"
        onClick={() => onDelete(user.id)}
      >
        {t('users.actions.delete')}
      </Button>
    </div>
  );
};

const Users: React.FC = () => {
  const { t } = useTranslation();
  const users = useUsers();
  const createUser = useCreateUser();
  const setUserEnabled = useSetUserEnabled();
  const resetUserPassword = useResetUserPassword();
  const deleteUser = useDeleteUser();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [enabled, setEnabled] = React.useState(true);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createUser.mutate({ username, password, enabled });
    setUsername('');
    setPassword('');
    setEnabled(true);
  };

  const columns = React.useMemo<ColumnDef<User>[]>(
    () => [
      { header: t('users.table.username'), accessorKey: 'username' },
      {
        header: t('users.table.status'),
        accessorKey: 'enabled',
        cell: ({ row }) =>
          row.original.enabled
            ? t('users.status.enabled')
            : t('users.status.disabled'),
      },
      { header: t('users.table.createdAt'), accessorKey: 'createdAt' },
      { header: t('users.table.updatedAt'), accessorKey: 'updatedAt' },
      {
        header: t('users.table.actions'),
        id: 'actions',
        // eslint-disable-next-line react/no-unstable-nested-components
        cell: ({ row }) => (
          <UserActions
            user={row.original}
            onDelete={(id) => deleteUser.mutate({ id })}
            onResetPassword={(id, newPassword) =>
              resetUserPassword.mutate({ id, password: newPassword })
            }
            onSetEnabled={(id, nextEnabled) =>
              setUserEnabled.mutate({ id, enabled: nextEnabled })
            }
          />
        ),
      },
    ],
    [deleteUser, resetUserPassword, setUserEnabled, t]
  );

  return (
    <>
      <PageHeading text={t('users.title')} />
      <form onSubmit={onSubmit}>
        <label>
          {t('users.fields.username')}
          <input
            aria-label={t('users.fields.username')}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>
        <label>
          {t('users.fields.password')}
          <input
            aria-label={t('users.fields.password')}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <label>
          <input
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            type="checkbox"
          />
          {t('users.fields.enabled')}
        </label>
        <Button buttonSize="M" buttonType="primary" type="submit">
          {t('users.actions.create')}
        </Button>
      </form>
      <Table
        columns={columns}
        data={users.data || []}
        emptyMessage={
          users.isFetched ? t('users.table.empty') : t('users.table.loading')
        }
      />
    </>
  );
};

export default Users;
