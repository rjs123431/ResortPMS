import { Link } from 'react-router-dom';
import { POSLayout } from '@components/layout/POSLayout';
import { POSSidebar } from '@components/layout/POSSidebar';
import { BuildingStorefrontIcon, RectangleStackIcon } from '@heroicons/react/24/outline';

export const POSSettingsPage = () => (
  <POSLayout sidebar={<POSSidebar />}>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage outlets and menu.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/pos/outlets"
          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-primary-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-500 dark:hover:bg-gray-700/50"
        >
          <div className="rounded-lg bg-primary-100 p-3 dark:bg-primary-900/30">
            <BuildingStorefrontIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Outlets</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage outlets, terminals, and tables.
            </p>
          </div>
        </Link>

        <Link
          to="/pos/menu"
          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-primary-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-500 dark:hover:bg-gray-700/50"
        >
          <div className="rounded-lg bg-primary-100 p-3 dark:bg-primary-900/30">
            <RectangleStackIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menus</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage menu categories and items.
            </p>
          </div>
        </Link>
      </div>
    </div>
  </POSLayout>
);
