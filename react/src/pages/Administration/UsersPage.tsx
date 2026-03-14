import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';
import {
  userService,
  type UserDto,
  type CreateUserDto,
  type RoleOption,
} from '@services/user.service';
import { UserDialog } from './UserDialog';

type UserFormState = Omit<UserDto, 'id' | 'fullName' | 'lastLoginTime' | 'creationTime'> & {
  password?: string;
};

const defaultForm: UserFormState = {
  userName: '',
  name: '',
  surname: '',
  emailAddress: '',
  isActive: true,
  roleNames: [],
  password: '',
};

export const UsersPage = () => {
  const queryClient = useQueryClient();
  const { isGranted } = useAuth();
  const canCreate = isGranted(PermissionNames.Pages_Admin_Users_Create);
  const canEdit = isGranted(PermissionNames.Pages_Admin_Users_Edit);
  const [keyword, setKeyword] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserFormState>(defaultForm);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', keyword],
    queryFn: () =>
      userService.getAll({
        keyword: keyword || undefined,
        skipCount: 0,
        maxResultCount: 100,
      }),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: () => userService.getRoles(),
    enabled: showCreate || editingId != null,
  });

  const roles: RoleOption[] = useMemo(() => rolesData ?? [], [rolesData]);

  const createMutation = useMutation({
    mutationFn: (dto: CreateUserDto) => userService.create(dto),
    onSuccess: () => {
      setShowCreate(false);
      setForm(defaultForm);
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (user: UserDto) => userService.update(user),
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const items = useMemo(() => data?.result?.items ?? [], [data]);
  const isDialogOpen = showCreate || editingId != null;

  const loadForEdit = async (id: number) => {
    const user = await userService.get(id);
    setForm({
      userName: user.userName,
      name: user.name,
      surname: user.surname,
      emailAddress: user.emailAddress,
      isActive: user.isActive,
      roleNames: user.roleNames ?? [],
    });
    setEditingId(id);
  };

  const handleClose = () => {
    setShowCreate(false);
    setEditingId(null);
    setForm(defaultForm);
  };

  const handleSave = () => {
    if (editingId != null) {
      updateMutation.mutate({
        id: editingId,
        userName: form.userName,
        name: form.name,
        surname: form.surname,
        emailAddress: form.emailAddress,
        isActive: form.isActive,
        roleNames: form.roleNames,
      });
    } else {
      createMutation.mutate({
        userName: form.userName,
        name: form.name,
        surname: form.surname,
        emailAddress: form.emailAddress,
        isActive: form.isActive,
        password: form.password ?? '',
        roleNames: form.roleNames,
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage application users and role assignments.
          </p>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User list</h2>
            <div className="flex items-end gap-2">
              <div className="w-full max-w-sm">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search
                </label>
                <input
                  className="w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="User name, name, email..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              {canCreate ? (
                <button
                  type="button"
                  className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
                  onClick={() => {
                    setForm(defaultForm);
                    setShowCreate(true);
                  }}
                >
                  New User
                </button>
              ) : null}
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300">
                      User name
                    </th>
                    <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300">
                      Name
                    </th>
                    <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </th>
                    <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300">
                      Roles
                    </th>
                    <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300">
                      Active
                    </th>
                    <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 dark:border-gray-700"
                    >
                      <td className="p-2">{item.userName}</td>
                      <td className="p-2">
                        {item.name} {item.surname}
                      </td>
                      <td className="p-2">{item.emailAddress}</td>
                      <td className="p-2">
                        {(item as UserDto).roleNames?.join(', ') ?? '-'}
                      </td>
                      <td className="p-2">{item.isActive ? 'Yes' : 'No'}</td>
                      <td className="p-2">
                        {canEdit ? (
                          <button
                            type="button"
                            className="rounded bg-slate-600 px-2 py-1 text-white hover:bg-slate-700"
                            onClick={() => void loadForEdit(item.id)}
                          >
                            Edit
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <UserDialog
          isOpen={isDialogOpen}
          isEdit={editingId != null}
          form={form}
          roles={roles}
          canCreate={canCreate}
          canEdit={canEdit}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onClose={handleClose}
          onFormChange={(updater) => setForm(updater)}
          onSave={handleSave}
        />
      </div>
    </MainLayout>
  );
};
