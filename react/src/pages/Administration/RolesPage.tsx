import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';
import {
  roleService,
  type RoleDto,
  type CreateRoleDto,
} from '@services/role.service';
import { RoleDialog } from './RoleDialog';

type RoleFormState = {
  name: string;
  displayName: string;
  description: string;
  grantedPermissions: string[];
};

const defaultForm: RoleFormState = {
  name: '',
  displayName: '',
  description: '',
  grantedPermissions: [],
};

export const RolesPage = () => {
  const queryClient = useQueryClient();
  const { isGranted } = useAuth();
  const canCreate = isGranted(PermissionNames.Pages_Admin_Roles_Create);
  const canEdit = isGranted(PermissionNames.Pages_Admin_Roles_Edit);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RoleFormState>(defaultForm);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-roles', filter],
    queryFn: () =>
      roleService.getAll({
        filter: filter || undefined,
        skipCount: 0,
        maxResultCount: 100,
      }),
  });

  const { data: editData } = useQuery({
    queryKey: ['admin-role-edit', editingId],
    queryFn: () => roleService.getForEdit(editingId!),
    enabled: editingId != null && editingId > 0,
  });

  const permissions = useMemo(
    () => editData?.permissions ?? [],
    [editData]
  );

  const createMutation = useMutation({
    mutationFn: (dto: CreateRoleDto) => roleService.create(dto),
    onSuccess: () => {
      setShowCreate(false);
      setForm(defaultForm);
      void queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (dto: RoleDto) => roleService.update(dto),
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
    },
  });

  const items = useMemo(() => data?.items ?? [], [data]);
  const isDialogOpen = showCreate || editingId != null;

  const permissionsForNew = useQuery({
    queryKey: ['admin-role-permissions-all'],
    queryFn: () => roleService.getAllPermissions(),
    enabled: showCreate,
  });

  const permissionsInDialog = showCreate
    ? (permissionsForNew.data ?? [])
    : permissions;

  const loadForEdit = (id: number) => {
    setForm(defaultForm);
    setEditingId(id);
  };

  const handleClose = () => {
    setShowCreate(false);
    setEditingId(null);
    setForm(defaultForm);
  };

  useEffect(() => {
    if (
      editingId != null &&
      editData?.role &&
      editData.role.id === editingId
    ) {
      setForm({
        name: editData.role.name,
        displayName: editData.role.displayName,
        description: editData.role.description ?? '',
        grantedPermissions: editData.grantedPermissionNames ?? [],
      });
    }
  }, [editingId, editData]);

  const handleSave = () => {
    if (editingId != null) {
      updateMutation.mutate({
        id: editingId,
        name: form.name,
        displayName: form.displayName,
        description: form.description || undefined,
        grantedPermissions: form.grantedPermissions,
      });
    } else {
      createMutation.mutate({
        name: form.name,
        displayName: form.displayName,
        description: form.description || undefined,
        grantedPermissions: form.grantedPermissions,
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage roles and permission assignments.
          </p>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Role list
            </h2>
            <div className="flex items-end gap-2">
              <div className="w-full max-w-sm">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search
                </label>
                <input
                  className="w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Name, display name..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
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
                  New Role
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
                      Name
                    </th>
                    <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300">
                      Display name
                    </th>
                    <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300">
                      Description
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
                      <td className="p-2">{item.name}</td>
                      <td className="p-2">{item.displayName}</td>
                      <td className="p-2">{item.description ?? '-'}</td>
                      <td className="p-2">
                        {canEdit ? (
                          <button
                            type="button"
                            className="rounded bg-slate-600 px-2 py-1 text-white hover:bg-slate-700"
                            onClick={() => loadForEdit(item.id)}
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

        <RoleDialog
          isOpen={isDialogOpen}
          isEdit={editingId != null}
          form={form}
          permissions={permissionsInDialog}
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
