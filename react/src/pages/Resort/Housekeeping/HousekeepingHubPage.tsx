import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HousekeepingLayout } from '@components/layout/HousekeepingLayout';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';
import { resortService } from '@services/resort.service';
import { HousekeepingStatus } from '@/types/resort.types';

interface NavCardProps {
  to: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  allowed: boolean;
}

const NavCard: React.FC<NavCardProps> = ({ to, label, description, icon, allowed }) => {
  if (!allowed) return null;
  return (
    <Link
      to={to}
      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all group"
    >
      <span className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
          {label}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
    </Link>
  );
};

const STATUS_LABELS: Record<number, string> = {
  [HousekeepingStatus.Clean]: 'Clean',
  [HousekeepingStatus.Dirty]: 'Dirty',
  [HousekeepingStatus.Inspected]: 'Inspected',
  [HousekeepingStatus.Pickup]: 'Pickup',
};

const STATUS_COLORS: Record<number, string> = {
  [HousekeepingStatus.Clean]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  [HousekeepingStatus.Dirty]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  [HousekeepingStatus.Inspected]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  [HousekeepingStatus.Pickup]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export const HousekeepingHubPage: React.FC = () => {
  const { isGranted } = useAuth();
  const canAccess = isGranted(PermissionNames.Pages_Rooms);

  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['housekeeping-logs-hub'],
    queryFn: () => resortService.getHousekeepingLogs({ maxResultCount: 100 }),
    staleTime: 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const logs = logsData?.items ?? [];

  const analytics = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayLogs = logs.filter(l => new Date(l.loggedAt).toDateString() === todayStr);

    const totalToday = todayLogs.length;
    const cleanedToday = todayLogs.filter(l => l.newStatus === HousekeepingStatus.Clean).length;
    const inspectedToday = todayLogs.filter(l => l.newStatus === HousekeepingStatus.Inspected).length;
    const pickupToday = todayLogs.filter(l => l.newStatus === HousekeepingStatus.Pickup).length;

    const staffCounts: Record<string, number> = {};
    for (const log of todayLogs) {
      const name = log.staffName || 'System';
      staffCounts[name] = (staffCounts[name] ?? 0) + 1;
    }
    const topStaff = Object.entries(staffCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const recentLogs = [...logs].slice(0, 8);

    return { totalToday, cleanedToday, inspectedToday, pickupToday, topStaff, recentLogs };
  }, [logs]);

  return (
    <HousekeepingLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Housekeeping</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Room status, cleaning board, and tasks.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NavCard
            to="/housekeeping/room-status"
            label="Room Status"
            description="View and update housekeeping room status."
            allowed={canAccess}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2m0 0v10a2 2 0 01-2 2H8a2 2 0 01-2-2V7m4 4h4m-4 4h4" />
              </svg>
            }
          />
          <NavCard
            to="/housekeeping/cleaning-board"
            label="Cleaning Board"
            description="Manage cleaning assignments and progress."
            allowed={canAccess}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
          />
          <NavCard
            to="/housekeeping/tasks"
            label="Tasks List"
            description="View and manage housekeeping tasks."
            allowed={canAccess}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Analytics Section */}
        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Activity</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status changes logged today.</p>
          </div>

          {isLoadingLogs ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading analytics...</p>
          ) : (
            <div className="space-y-6">
              {/* Stat tiles */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Total Changes', value: analytics.totalToday, color: 'text-gray-900 dark:text-white' },
                  { label: 'Cleaned', value: analytics.cleanedToday, color: 'text-green-600 dark:text-green-400' },
                  { label: 'Inspected', value: analytics.inspectedToday, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Pickup', value: analytics.pickupToday, color: 'text-yellow-600 dark:text-yellow-400' },
                ].map(stat => (
                  <div key={stat.label} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
                    <p className={`text-3xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Top staff */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Top Staff Today</h3>
                  {analytics.topStaff.length === 0 ? (
                    <p className="text-sm text-gray-400">No activity recorded yet today.</p>
                  ) : (
                    <ul className="space-y-2">
                      {analytics.topStaff.map(([name, count]) => (
                        <li key={name} className="flex items-center gap-3">
                          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 text-xs font-bold text-primary-700 dark:text-primary-300">
                            {name.charAt(0).toUpperCase()}
                          </span>
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="truncate text-sm text-gray-800 dark:text-gray-200">{name}</span>
                            <span className="ml-auto flex-shrink-0 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                              {count}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Recent activity */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Log Entries</h3>
                  {analytics.recentLogs.length === 0 ? (
                    <p className="text-sm text-gray-400">No logs available.</p>
                  ) : (
                    <ul className="space-y-2">
                      {analytics.recentLogs.map(log => (
                        <li key={log.id} className="flex items-start gap-3 text-sm">
                          <span className={`mt-0.5 flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_COLORS[log.newStatus]}`}>
                            {STATUS_LABELS[log.newStatus] ?? log.newStatus}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-gray-800 dark:text-gray-200">Room {log.roomNumber}</span>
                            <span className="text-gray-400"> · {log.staffName || 'System'}</span>
                          </div>
                          <span className="flex-shrink-0 tabular-nums text-gray-400">
                            {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </HousekeepingLayout>
  );
};
