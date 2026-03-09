import React, { useEffect, useState } from 'react';
import { MainLayout } from '@components/layout/MainLayout';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';
import { userSessionService, UserSessionDto } from '@services/userSession.service';
import { getDeviceFingerprint } from '@utils/deviceFingerprint';
import { Link } from 'react-router-dom';

function formatLastActivity(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFirstLogin(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays > 365) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const MyAccountPage: React.FC = () => {
  const { isGranted, user } = useAuth();
  const canSeeImpersonation = isGranted(PermissionNames.Pages_Admin_Users);
  const [sessions, setSessions] = useState<UserSessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const deviceFingerprint = getDeviceFingerprint();
      const list = await userSessionService.getMySessions(deviceFingerprint);
      setSessions(list);
    } catch (e) {
      console.error('Failed to load sessions:', e);
      setError('Failed to load devices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevoke = async (sessionId: number) => {
    if (revokingId != null) return;
    setRevokingId(sessionId);
    try {
      await userSessionService.revokeSession(sessionId);
      await loadSessions();
    } catch (e) {
      console.error('Failed to revoke session:', e);
      setError('Failed to sign out that device.');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        {/* Personal Information Section */}
        <section>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Personal Information</h1>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-2">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-200">Name:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{user ? `${user.name} ${user.surname}` : '-'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-200">Email:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{user?.emailAddress || '-'}</span>
            </div>
            {user?.userName && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-200">Username:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{user.userName}</span>
              </div>
            )}
            {/* Add more fields if needed, based on available user properties */}
          </div>
        </section>

        {/* Security & Sign-in Section */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Security & sign-in</h2>
          <div className="mb-4">
            <Link to="/change-password" className="text-blue-600 hover:underline font-medium">
              Change password
            </Link>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Device sessions</h3>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <ul className="space-y-4">
                {sessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {s.deviceName || 'Unknown device'}
                          {s.browser ? `, ${s.browser}` : ''}
                        </span>
                        {s.isCurrent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            This device
                          </span>
                        )}
                        {canSeeImpersonation && s.impersonatorUserId != null && s.impersonatorUserId > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" title="Session started via impersonation">
                            Impersonation
                          </span>
                        )}
                      </div>
                      {(s.location || s.lastActivityAt) && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {s.location && <span>{s.location}</span>}
                          {s.location && s.lastActivityAt && ' · '}
                          {s.lastActivityAt && (
                            <span title={new Date(s.lastActivityAt).toLocaleString()}>
                              {formatLastActivity(s.lastActivityAt)}
                            </span>
                          )}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        First signed in {formatFirstLogin(s.firstLoginAt)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {s.isCurrent ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400">Current session</span>
                      ) : (
                        <button
                          className="px-3 py-1 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:bg-red-300"
                          disabled={revokingId === s.id}
                          onClick={() => handleRevoke(s.id)}
                        >
                          {revokingId === s.id ? 'Signing out...' : 'Sign out'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {!loading && sessions.length === 0 && !error && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No sessions found.</p>
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};
