import React from 'react';
import { MaintenanceLayout } from '@components/layout/MaintenanceLayout';

export const AssetEquipmentPage: React.FC = () => (
  <MaintenanceLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assets &amp; Equipment</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage the resort's asset and equipment registry.</p>
      </div>
      <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon.</p>
      </section>
    </div>
  </MaintenanceLayout>
);
