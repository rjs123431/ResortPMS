import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '@components/common/ThemeToggle';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';

interface MenuItem {
  path?: string;
  label: string;
  icon: React.ReactNode;
  children?: MenuItem[];
  /** User needs all of these permissions (default). */
  permissions?: string[];
  /** If true, user only needs one of the permissions. Use when parent permission may not be granted but child permissions are. */
  permissionsAny?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Resort Setup', 'Front Desk']);
  const { isGranted } = useAuth();

  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        path: '/',
        label: 'Dashboard',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
      {
        label: 'Front Desk',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-8 4h6m-8 6h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        children: [
          {
            path: '/room-rack',
            label: 'Room Rack',
            permissions: [PermissionNames.Pages_Rooms],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2m0 0v10a2 2 0 01-2 2H8a2 2 0 01-2-2V7m4 4h4m-4 4h4" />
              </svg>
            ),
          },
          {
            path: '/reservations',
            label: 'Reservations',
            permissions: [PermissionNames.Pages_Reservations],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
          },
          {
            path: '/check-in',
            label: 'Check-In',
            permissions: [PermissionNames.Pages_CheckIn],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 8l2 2 4-4" />
              </svg>
            ),
          },
          {
            path: '/stays',
            label: 'In-House',
            permissions: [PermissionNames.Pages_Stays],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-6 4h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ),
          },
          {
            path: '/check-out',
            label: 'Check-Out',
            permissions: [PermissionNames.Pages_CheckOut],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V7m-6 14h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            ),
          },
        ],
      },
      {
        label: 'Housekeeping',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
        children: [
          {
            path: '/housekeeping/room-status',
            label: 'Room Status',
            permissions: [PermissionNames.Pages_Rooms],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2m0 0v10a2 2 0 01-2 2H8a2 2 0 01-2-2V7m4 4h4m-4 4h4" />
              </svg>
            ),
          },
          {
            path: '/housekeeping/cleaning-board',
            label: 'Cleaning Board',
            permissions: [PermissionNames.Pages_Rooms],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            ),
          },
          {
            path: '/housekeeping/tasks',
            label: 'Tasks List',
            permissions: [PermissionNames.Pages_Rooms],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
        ],
      },
      {
        path: '/pos',
        label: 'POS',
        permissions: [PermissionNames.Pages_POS],
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        ),
      },
      {
        label: 'Administration',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        children: [
          {
            path: '/administration/users',
            label: 'Users',
            permissions: [PermissionNames.Pages_Admin_Users],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ),
          },
          {
            path: '/administration/roles',
            label: 'Roles',
            permissions: [PermissionNames.Pages_Admin_Roles],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ),
          },
        ],
      },
      {
        label: 'Setup',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l8-4 6 3v15M9 9h.01M9 12h.01M9 15h.01M13 9h.01M13 12h.01M13 15h.01" />
          </svg>
        ),
        children: [
          {
            path: '/guests',
            label: 'Guests',
            permissions: [PermissionNames.Pages_Guests],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V4H2v16h5m10 0v-4a3 3 0 00-3-3H10a3 3 0 00-3 3v4m10 0H7m10-9a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ),
          },
          {
            path: '/rooms',
            label: 'Rooms',
            permissions: [PermissionNames.Pages_Rooms],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M5 7V5a2 2 0 012-2h10a2 2 0 012 2v2m0 0v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7m4 6h6" />
              </svg>
            ),
          },
          {
            path: '/room-types',
            label: 'Room Types',
            permissions: [PermissionNames.Pages_RoomTypes],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M5 7V5a2 2 0 012-2h10a2 2 0 012 2v2m0 0v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7m4 6h6" />
              </svg>
            ),
          },
          {
            path: '/room-rate-plans',
            label: 'Room Rate Plans',
            permissions: [PermissionNames.Pages_RoomRatePlans],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            path: '/charge-types',
            label: 'Charge Types',
            permissions: [PermissionNames.Pages_ChargeTypes],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 .895-4 2s1.79 2 4 2 4 .895 4 2-1.79 2-4 2m0-8c1.11 0 2.08.228 2.8.596M12 8V6m0 10v2m0 0c-1.11 0-2.08-.228-2.8-.596" />
              </svg>
            ),
          },
          {
            path: '/payment-methods',
            label: 'Payment Methods',
            permissions: [PermissionNames.Pages_PaymentMethods],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h4m-8 4h18a2 2 0 002-2V7a2 2 0 00-2-2H3a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ),
          },
          {
            path: '/extra-bed-types',
            label: 'Extra Bed Types',
            permissions: [PermissionNames.Pages_ExtraBedTypes],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 12h8M8 17h5M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
              </svg>
            ),
          },
          {
            path: '/staff',
            label: 'Staff',
            permissions: [PermissionNames.Pages_Staff],
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V4H2v16h5m10 0v-4a3 3 0 00-3-3H10a3 3 0 00-3 3v4m10 0H7m10-9a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ),
          },
        ],
      },
    ],
    []
  );

  useEffect(() => {
    const pathname = location.pathname;
    const toExpand: string[] = [];
    menuItems.forEach((item) => {
      if (item.children?.length) {
        const hasActiveChild = item.children.some((child) => child.path && (pathname === child.path || pathname.startsWith(`${child.path}/`)));
        if (hasActiveChild) toExpand.push(item.label);
      }
    });

    if (toExpand.length > 0) {
      setExpandedMenus((prev) => Array.from(new Set([...prev, ...toExpand])));
    }
  }, [location.pathname, menuItems]);

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`));

  const isParentActive = (children?: MenuItem[]) => {
    if (!children) return false;
    return children.some((child) => child.path && isActive(child.path));
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]));
  };

  const hasPermission = (item: MenuItem) => {
    if (!item.permissions || item.permissions.length === 0) return true;
    if (item.permissionsAny) return item.permissions.some((perm) => isGranted(perm));
    return item.permissions.every((perm) => isGranted(perm));
  };

  const filterMenuItems = (items: MenuItem[]): MenuItem[] =>
    items
      .filter((item) => hasPermission(item))
      .map((item) => (item.children ? { ...item, children: filterMenuItems(item.children) } : item))
      .filter((item) => !item.children || item.children.length > 0);

  const visibleMenuItems = useMemo(() => filterMenuItems(menuItems), [menuItems, isGranted]);

  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.label);
    const parentActive = isParentActive(item.children);

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            type="button"
            onClick={() => toggleMenu(item.label)}
            className={`
              w-full flex items-center justify-between px-4 py-3 min-h-[2.75rem] rounded-lg touch-manipulation
              transition-colors duration-200
              ${parentActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
            `}
          >
            <div className="flex items-center space-x-2">
              <span className={parentActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            <svg className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isExpanded ? (
            <div className="ml-4 mt-1 space-y-1">
              {item.children?.map((child) => (
                <Link
                  key={child.path}
                  to={child.path || '#'}
                  onClick={onClose}
                  className={`
                    flex items-center space-x-2 px-4 py-2.5 min-h-[2.5rem] rounded-lg touch-manipulation
                    transition-colors duration-200
                    ${child.path && isActive(child.path) ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}
                  `}
                >
                  <span className={child.path && isActive(child.path) ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}>{child.icon}</span>
                  <span>{child.label}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path || '#'}
        onClick={onClose}
        className={`
          flex items-center space-x-2 px-4 py-3 min-h-[2.75rem] rounded-lg touch-manipulation
          transition-colors duration-200
          ${item.path && isActive(item.path) ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
        `}
      >
        <span className={item.path && isActive(item.path) ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}>{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {isOpen ? (
        <div className="fixed inset-0 top-14 z-40 bg-gray-600/75 dark:bg-gray-900/75 sm:top-16 lg:hidden" onClick={onClose} aria-hidden="true" />
      ) : null}

      <aside
        className={`
          fixed top-14 sm:top-16 bottom-0 left-0 z-50 w-64 max-w-[85vw] bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          lg:inset-y-0 lg:top-0 lg:static lg:z-auto lg:max-w-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex h-full flex-col">
          <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden py-2 sm:py-3">{visibleMenuItems.map((item) => renderMenuItem(item))}</nav>
          <div className="flex-shrink-0 px-4 pb-6 pt-2">
            <ThemeToggle variant="inline" />
          </div>
        </div>
      </aside>
    </>
  );
};
