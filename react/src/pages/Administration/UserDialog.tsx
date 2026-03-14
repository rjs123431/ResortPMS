import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { UserDto, CreateUserDto } from '@services/user.service';
import type { RoleOption } from '@services/user.service';

type UserFormState = Omit<UserDto, 'id' | 'fullName' | 'lastLoginTime' | 'creationTime'> & {
  password?: string;
};

type UserDialogProps = {
  isOpen: boolean;
  isEdit: boolean;
  form: UserFormState;
  roles: RoleOption[];
  canCreate: boolean;
  canEdit: boolean;
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: UserFormState) => UserFormState) => void;
  onSave: () => void;
};

export const UserDialog = ({
  isOpen,
  isEdit,
  form,
  roles,
  canCreate,
  canEdit,
  isSaving,
  onClose,
  onFormChange,
  onSave,
}: UserDialogProps) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const canSave = isEdit ? canEdit : canCreate;
  const valid =
    form.userName?.trim() &&
    form.name?.trim() &&
    form.surname?.trim() &&
    form.emailAddress?.trim() &&
    (isEdit || (form as { password?: string }).password);

  return (
    <Dialog open={isOpen} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" aria-hidden />
      <div className="flex min-h-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
              {isEdit ? 'Edit User' : 'New User'}
            </DialogTitle>
            <button
              type="button"
              className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                User name
              </label>
              <input
                className="w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.userName ?? ''}
                disabled={isEdit}
                onChange={(e) => onFormChange((s) => ({ ...s, userName: e.target.value }))}
              />
              {isEdit ? (
                <p className="mt-0.5 text-xs text-gray-500">User name cannot be changed.</p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  className="w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600"
                  value={form.name ?? ''}
                  onChange={(e) => onFormChange((s) => ({ ...s, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Surname
                </label>
                <input
                  className="w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600"
                  value={form.surname ?? ''}
                  onChange={(e) => onFormChange((s) => ({ ...s, surname: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.emailAddress ?? ''}
                onChange={(e) => onFormChange((s) => ({ ...s, emailAddress: e.target.value }))}
              />
            </div>
            {!isEdit ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600"
                  value={(form as { password?: string }).password ?? ''}
                  onChange={(e) =>
                    onFormChange((s) => ({ ...s, password: e.target.value } as UserFormState))
                  }
                />
              </div>
            ) : null}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Roles
              </label>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded border border-gray-200 p-2 dark:border-gray-600">
                {roles.map((role) => {
                  const roleKey = role.normalizedName ?? role.name;
                  const checked = (form.roleNames ?? []).includes(roleKey);
                  return (
                    <label
                      key={role.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...(form.roleNames ?? []), roleKey]
                            : (form.roleNames ?? []).filter((n) => n !== roleKey);
                          onFormChange((s) => ({ ...s, roleNames: next }));
                        }}
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        {role.displayName || role.name}
                      </span>
                    </label>
                  );
                })}
                {roles.length === 0 ? (
                  <p className="text-sm text-gray-500">No roles defined.</p>
                ) : null}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => onFormChange((s) => ({ ...s, isActive: e.target.checked }))}
              />
              <span className="text-gray-700 dark:text-gray-300">Active</span>
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
              disabled={isSaving || !canSave || !valid}
              onClick={onSave}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
