import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MaintenanceSidebar } from './MaintenanceSidebar';

type MaintenanceLayoutProps = {
  children: React.ReactNode;
};

export const MaintenanceLayout: React.FC<MaintenanceLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen h-screen max-h-[100dvh] overflow-hidden bg-gray-50 dark:bg-gray-900 safe-area-inset">
      <Header showTopNav />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <MaintenanceSidebar />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              {children}
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
};
