import { POSLayout } from '@components/layout/POSLayout';
import { POSSidebar } from '@components/layout/POSSidebar';

export const POSReportsPage = () => (
  <POSLayout sidebar={<POSSidebar />}>
    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Reports</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Show reports. (Coming soon)
      </p>
    </div>
  </POSLayout>
);
