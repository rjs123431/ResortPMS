import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { FrontDeskTopNav } from './FrontDeskTopNav';

type FrontDeskLayoutProps = {
  children: React.ReactNode;
};

export const FrontDeskLayout: React.FC<FrontDeskLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen h-screen max-h-[100dvh] overflow-hidden bg-gray-50 dark:bg-gray-900 safe-area-inset">
      <Header showTopNav />

      <FrontDeskTopNav />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900">
            <div className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4">
              {children}
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
};
