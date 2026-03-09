import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { userService, UserDto } from '@/services/user.service';
import { roleService } from '@/services/role.service';
import type { UserListItem } from '@/types/user.types';
import type { RoleDto } from '@/types/role.types';

interface EditUserDialogProps {
  open: boolean;
  user: UserListItem | null;
  onClose: () => void;
  onSave: () => void;
}


export const EditUserDialog: React.FC<EditUserDialogProps> = ({ open, user, onClose, onSave }) => {
  const [form, setForm] = useState<UserListItem | null>(user);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [checkedRoles, setCheckedRoles] = useState<string[]>([]);

  useEffect(() => {
    setForm(user);
    setError(null);
    if (user && Array.isArray((user as UserDto).roleNames)) {
      setCheckedRoles((user as UserDto).roleNames ?? []);
    } else {
      setCheckedRoles([]);
    }
  }, [user, open]);

  useEffect(() => {
    if (open) {
      roleService.getAll().then(res => {
        setRoles(res.result.items);
      });
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!form) return;
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (role: RoleDto, checked: boolean) => {
    setCheckedRoles(prev =>
      checked ? [...prev, role.normalizedName] : prev.filter(r => r !== role.normalizedName)
    );
  };

  const handleSubmit = async () => {
    if (!form) return;
    setSubmitting(true);
    setError(null);
    try {
      // Attach roles to payload, use UserDto type
      const payload: UserDto = {
        ...form,
        roleNames: checkedRoles,
      } as UserDto;
      await userService.update(payload);
      onSave();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!form) return null;

  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="fixed inset-0 z-40 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-auto p-6 z-50">
          <Dialog.Title className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Edit User</Dialog.Title>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">First Name</label>
              <input
                className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={32}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Last Name</label>
              <input
                className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                name="surname"
                value={form.surname}
                onChange={handleChange}
                maxLength={32}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">User Name</label>
              <input
                className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                name="userName"
                value={form.userName}
                onChange={handleChange}
                maxLength={32}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Email Address</label>
              <input
                className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                name="emailAddress"
                type="email"
                value={form.emailAddress}
                onChange={handleChange}
                maxLength={256}
                required
              />
            </div>

            {/* Roles Section */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Roles</label>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <label key={role.normalizedName} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      checked={checkedRoles.includes(role.normalizedName)}
                      onChange={e => handleRoleChange(role, e.target.checked)}
                    />
                    <span className="text-gray-800 dark:text-gray-100">{role.displayName || role.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          {error && <div className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</div>}
          <div className="mt-6 flex justify-end gap-2">
            <button
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              onClick={onClose}
              type="button"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
              onClick={handleSubmit}
              disabled={submitting}
              type="button"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
