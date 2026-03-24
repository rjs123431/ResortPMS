import type { QueryClient } from '@tanstack/react-query';

export const resortKeys = {
  guests: (filter = '') => ['resort-guests', filter] as const,
  roomTypesPaged: (filter = '') => ['resort-room-types-paged', filter] as const,
  roomTypes: () => ['resort-room-types'] as const,
  frontDeskDashboard: () => ['front-desk-dashboard'] as const,
  frontDeskArrivalsToday: () => ['front-desk-dashboard', 'arrivals-today'] as const,
  frontDeskDeparturesToday: () => ['front-desk-dashboard', 'departures-today'] as const,
  housekeepingTasks: () => ['housekeeping-tasks'] as const,
  resortGuestRequests: () => ['resort-guest-requests'] as const,
  resortGuestRequestCompletionContext: () => ['resort-guest-request-completion-context'] as const,
} as const;

export type ResortInvalidateScope =
  | 'guests'
  | 'roomTypes'
  | 'frontDeskDashboard'
  | 'housekeepingAndRequests'
  | 'all';

export function invalidateResortQueries(queryClient: QueryClient, scope: ResortInvalidateScope): void {
  switch (scope) {
    case 'guests':
      void queryClient.invalidateQueries({ queryKey: ['resort-guests'] });
      break;
    case 'roomTypes':
      void queryClient.invalidateQueries({ queryKey: ['resort-room-types-paged'] });
      void queryClient.invalidateQueries({ queryKey: resortKeys.roomTypes() });
      break;
    case 'frontDeskDashboard':
      void queryClient.invalidateQueries({ queryKey: resortKeys.frontDeskDashboard() });
      void queryClient.invalidateQueries({ queryKey: resortKeys.frontDeskArrivalsToday() });
      void queryClient.invalidateQueries({ queryKey: resortKeys.frontDeskDeparturesToday() });
      break;
    case 'housekeepingAndRequests':
      void queryClient.invalidateQueries({ queryKey: resortKeys.housekeepingTasks() });
      void queryClient.invalidateQueries({ queryKey: resortKeys.resortGuestRequests() });
      void queryClient.invalidateQueries({ queryKey: resortKeys.resortGuestRequestCompletionContext() });
      break;
    case 'all':
      void queryClient.invalidateQueries({
        predicate: (q) => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('resort-'),
      });
      break;
    default:
      break;
  }
}
