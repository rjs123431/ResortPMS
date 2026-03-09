import React, { useEffect, useState } from 'react';
import { MainLayout } from '@components/layout/MainLayout';
import { useAuth } from '@contexts/AuthContext';
import { userService } from '@services/user.service';
import { authService } from '@services/auth.service';

import { UserListItem } from '@/types/user.types';
import { EditUserDialog } from './EditUserDialog';
import { EditUserPasswordDialog } from './EditUserPasswordDialog';

export const ImpersonatePage: React.FC = () => {
  const { user, tenant } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null);
  // const [registerLoading, setRegisterLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [impersonatingUserId, setImpersonatingUserId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const isAdmin = (user?.userName || '').trim().toLowerCase() === 'admin';

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const loadUsers = async (page: number, keyword: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.getAll({
        keyword: keyword.trim() || undefined,
        skipCount: (page - 1) * pageSize,
        maxResultCount: pageSize,
      });

      const items = response.result.items.filter((candidate) => candidate.id !== user?.id);
      setUsers(items);
      setTotalCount(response.result.totalCount);
    } catch (loadError) {
      console.error('Failed to load users for impersonation:', loadError);
      setError('Unable to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers(currentPage, query);
    }
  }, [isAdmin, currentPage, query]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const clampedPage = Math.min(currentPage, totalPages);
  const pageStart = (clampedPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, totalCount);

  const handleImpersonate = async (target: UserListItem) => {
    if (!target.id || impersonatingUserId) {
      return;
    }

    setImpersonatingUserId(target.id);
    setError(null);

    try {
      const impersonateResult = await authService.impersonate({
        userId: target.id,
        tenantId: tenant?.id ?? null,
      });

      const authResult = await authService.impersonatedAuthenticate(impersonateResult.impersonationToken);
      authService.setAuthToken(authResult.accessToken, authResult.expireInSeconds, authResult.encryptedAccessToken);
      window.location.assign('/');
    } catch (impersonateError) {
      console.error('Failed to impersonate user:', impersonateError);
      setError('Failed to impersonate user.');
      setImpersonatingUserId(null);
    }
  };

  const handleRefresh = async () => {
    if (!isAdmin) {
      return;
    }

    await loadUsers(currentPage, query);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Impersonate User</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Select a user to sign in as.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || !isAdmin}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60"
            >
              Refresh
            </button>
          </div>
        </div>

        {!isAdmin && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            You do not have permission to impersonate users.
          </div>
        )}

        {isAdmin && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full max-w-xl">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Users</label>
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {totalCount} users
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading && (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Loading users...</div>
                )}

                {!isLoading && totalCount === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No users found.</div>
                )}

                {!isLoading && totalCount > 0 && (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {users.map((candidate) => {
                      const displayName = candidate.fullName
                        || [candidate.name, candidate.surname].filter(Boolean).join(' ')
                        || candidate.userName
                        || `User ${candidate.id}`;
                      const isBusy = impersonatingUserId === candidate.id;

                      return (
                        <li key={candidate.id} className="px-4 py-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {displayName}
                              </div>
                              {candidate.emailAddress && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">{candidate.emailAddress}</div>
                              )}
                              {candidate.lastLoginTime && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Last login: {new Date(candidate.lastLoginTime).toLocaleString()}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => { setEditUser(candidate); setShowEditDialog(true); }}
                                className="inline-flex items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => { setPasswordUserId(candidate.id); setShowPasswordDialog(true); }}
                                className="inline-flex items-center justify-center rounded-md bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-600"
                              >
                                Reset Password
                              </button>
                              <button
                                type="button"
                                onClick={() => handleImpersonate(candidate)}
                                disabled={isBusy}
                                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                              >
                                {isBusy ? 'Switching...' : 'Impersonate'}
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {totalCount > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {pageStart + 1}-{pageEnd} of {totalCount}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={clampedPage <= 1}
                    className="rounded-md border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Page {clampedPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={clampedPage >= totalPages}
                    className="rounded-md border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    <EditUserDialog
      open={showEditDialog}
      user={editUser}
      onClose={() => setShowEditDialog(false)}
      onSave={async () => { setShowEditDialog(false); await loadUsers(currentPage, query); }}
    />
    <EditUserPasswordDialog
      open={showPasswordDialog}
      userId={passwordUserId}
      onClose={() => { setShowPasswordDialog(false); setPasswordUserId(null); }}
      onSuccess={() => { setShowPasswordDialog(false); setPasswordUserId(null); }}
    />
  </MainLayout>
  );
};
