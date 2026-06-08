import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib/testHelpers';
import Users from 'components/Users/Users';
import {
  useCreateUser,
  useDeleteUser,
  useResetUserPassword,
  useSetUserEnabled,
  useUsers,
} from 'lib/hooks/api/users';

jest.mock('lib/hooks/api/users', () => ({
  useCreateUser: jest.fn(),
  useDeleteUser: jest.fn(),
  useResetUserPassword: jest.fn(),
  useSetUserEnabled: jest.fn(),
  useUsers: jest.fn(),
}));

const createUser = jest.fn();
const deleteUser = jest.fn();
const resetPassword = jest.fn();
const setUserEnabled = jest.fn();

describe('Users', () => {
  beforeEach(() => {
    createUser.mockReset();
    deleteUser.mockReset();
    resetPassword.mockReset();
    setUserEnabled.mockReset();

    (useUsers as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          username: 'admin',
          enabled: true,
          createdAt: '2026-06-08T10:00:00Z',
          updatedAt: '2026-06-08T10:00:00Z',
        },
      ],
      isFetched: true,
    });
    (useCreateUser as jest.Mock).mockReturnValue({ mutate: createUser });
    (useDeleteUser as jest.Mock).mockReturnValue({ mutate: deleteUser });
    (useResetUserPassword as jest.Mock).mockReturnValue({
      mutate: resetPassword,
    });
    (useSetUserEnabled as jest.Mock).mockReturnValue({
      mutate: setUserEnabled,
    });
  });

  it('renders users without password hashes', () => {
    render(<Users />);

    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getAllByText('Enabled')).not.toHaveLength(0);
    expect(screen.queryByText(/hash/i)).not.toBeInTheDocument();
  });

  it('creates enabled users from the form', async () => {
    render(<Users />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Username'), 'ops');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Create user' }));

    expect(createUser).toHaveBeenCalledWith({
      username: 'ops',
      password: 'secret',
      enabled: true,
    });
  });

  it('calls row actions', async () => {
    render(<Users />);

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText('New password for admin'),
      'new-secret'
    );
    await user.click(screen.getByRole('button', { name: 'Disable admin' }));
    await user.click(
      screen.getByRole('button', { name: 'Reset password for admin' })
    );
    await user.click(screen.getByRole('button', { name: 'Delete admin' }));

    expect(setUserEnabled).toHaveBeenCalledWith({ id: 1, enabled: false });
    expect(resetPassword).toHaveBeenCalledWith({
      id: 1,
      password: 'new-secret',
    });
    expect(deleteUser).toHaveBeenCalledWith({ id: 1 });
  });
});
