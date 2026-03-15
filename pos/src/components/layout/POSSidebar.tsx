import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  TableCellsIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/', label: 'Home', title: 'POS Order Page', Icon: HomeIcon },
  { to: '/tables', label: 'Tables', title: 'Manage tables of an outlet', Icon: TableCellsIcon },
  { to: '/orders', label: 'Orders', title: 'View list of orders, manage it', Icon: ClipboardDocumentListIcon },
  { to: '/reports', label: 'Reports', title: 'Show reports', Icon: ChartBarIcon },
  { to: '/outlets', label: 'Outlets', title: 'Manage outlets, terminals, tables', Icon: BuildingStorefrontIcon },
  { to: '/menu', label: 'Menu', title: 'Manage menu categories and items', Icon: RectangleStackIcon },
  { to: '/settings', label: 'Settings', title: 'POS settings', Icon: Cog6ToothIcon },
] as const;

interface POSSidebarProps {
  onClose?: () => void;
}

export const POSSidebar: React.FC<POSSidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const isOrderPage = location.pathname === '/' || location.pathname.startsWith('/order/');

  return (
    <nav className="flex flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 lg:border-r">
      <ul className="flex flex-col gap-0.5 p-2 lg:p-2">
        {navItems.map(({ to, label, title, Icon }) => {
          const isActive = to === '/' ? isOrderPage : location.pathname.startsWith(to);
          return (
            <li key={to}>
              <NavLink
                to={to}
                title={title}
                onClick={onClose}
                className={() =>
                  `flex min-h-[44px] min-w-[44px] items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition active:scale-[0.98] lg:flex-col lg:gap-1 lg:px-3 lg:py-3 lg:text-center ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`
                }
              >
                <Icon className="h-6 w-6 shrink-0" aria-hidden />
                <span>{label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
