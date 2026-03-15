export const APP_NAME = 'PMS';
export const APP_VERSION = '1.0.0';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  EMPLOYEES: '/employees',
  PAYROLL: '/payroll',
  TIMEKEEPING: '/timekeeping',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

export const QUERY_KEYS = {
  ITEMS: 'items',
  USERS: 'users',
  SESSION: 'session',
} as const;

export const DATE_FORMAT = 'MM/DD/YYYY';
export const TIME_FORMAT = 'HH:mm:ss';
