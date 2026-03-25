import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@contexts/AuthContext';
import { ThemeProvider } from '@contexts/ThemeContext';
import { SignalRProvider } from '@contexts/SignalRContext';
import { POSSessionProvider } from '@contexts/POSSessionContext';
import { ProtectedRoute } from '@components/auth/ProtectedRoute';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { LogoSpinner } from '@components/common/LogoSpinner';
import UpdateNotification from '@components/common/UpdateNotification';
import { NotificationToast } from '@components/common/NotificationToast';
import { initAbpEvents } from '@/utils/abp-events';
import './index.css';
import { PermissionNames } from './config/permissionNames';

const LoginPage = lazy(() => import('@pages/Login/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@pages/Register/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('@pages/ForgotPassword/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@pages/ResetPassword/ResetPasswordPage').then((m) => ({ default: m.default })));

const POSOrderPage = lazy(() => import('@/pages/POS/POSOrderPage').then((m) => ({ default: m.POSOrderPage })));
const POSPage = lazy(() => import('@/pages/POS/POSPage').then((m) => ({ default: m.POSPage })));
const POSTablesPage = lazy(() => import('@/pages/POS/POSTablesPage').then((m) => ({ default: m.POSTablesPage })));
const POSOrdersPage = lazy(() => import('@/pages/POS/POSOrdersPage').then((m) => ({ default: m.POSOrdersPage })));
const POSReportsPage = lazy(() => import('@/pages/POS/POSReportsPage').then((m) => ({ default: m.POSReportsPage })));
const POSSettingsPage = lazy(() => import('@/pages/POS/POSSettingsPage').then((m) => ({ default: m.POSSettingsPage })));
const PosOutletsPage = lazy(() => import('@/pages/POS/PosOutletsPage').then((m) => ({ default: m.PosOutletsPage })));
const PosMenuPage = lazy(() => import('@/pages/POS/PosMenuPage').then((m) => ({ default: m.PosMenuPage })));
const PosOptionGroupsPage = lazy(() => import('@/pages/POS/PosOptionGroupsPage').then((m) => ({ default: m.PosOptionGroupsPage })));
const PosPriceAdjustmentsPage = lazy(() => import('@/pages/POS/PosPriceAdjustmentsPage').then((m) => ({ default: m.PosPriceAdjustmentsPage })));
const PosPromosPage = lazy(() => import('@/pages/POS/PosPromosPage').then((m) => ({ default: m.PosPromosPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const PageTitle: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  useEffect(() => {
    document.title = `${title} - POS`;
  }, [title]);

  return <>{children}</>;
};

const LoadingScreen: React.FC = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <LogoSpinner sizeClassName="h-10 w-10" logoSizeClassName="h-6 w-6" spinnerClassName="border-b-2 border-blue-500" />
  </div>
);

const App: React.FC = () => {
  useEffect(() => {
    initAbpEvents();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <SignalRProvider>
                <POSSessionProvider>
                  <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                      <Route
                        path="/account/reset-password"
                        element={
                          <PageTitle title="Reset Password">
                            <ResetPasswordPage />
                          </PageTitle>
                        }
                      />
                      <Route
                        path="/login"
                        element={
                          <PageTitle title="Login">
                            <LoginPage />
                          </PageTitle>
                        }
                      />
                      <Route
                        path="/register"
                        element={
                          <PageTitle title="Register">
                            <RegisterPage />
                          </PageTitle>
                        }
                      />
                      <Route
                        path="/forgot-password"
                        element={
                          <PageTitle title="Forgot Password">
                            <ForgotPasswordPage />
                          </PageTitle>
                        }
                      />
                      <Route
                        path="/"
                        element={
                          <PageTitle title="POS">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                              <POSPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="/order/:orderId"
                        element={
                          <PageTitle title="POS">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                              <POSOrderPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="/tables"
                        element={
                          <PageTitle title="POS Tables">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                              <POSTablesPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="/orders"
                        element={
                          <PageTitle title="POS Orders">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                              <POSOrdersPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="/reports"
                        element={
                          <PageTitle title="POS Reports">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                              <POSReportsPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <PageTitle title="POS Settings">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                              <POSSettingsPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="/outlets"
                        element={
                          <PageTitle title="POS Outlets">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                              <PosOutletsPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="/menu"
                        element={
                          <PageTitle title="POS Menu">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                              <PosMenuPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="/option-groups"
                        element={
                          <PageTitle title="POS Option Groups">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                              <PosOptionGroupsPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="/price-adjustments"
                        element={
                          <PageTitle title="POS Price Adjustments">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                              <PosPriceAdjustmentsPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="/promos"
                        element={
                          <PageTitle title="POS Promos">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                              <PosPromosPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                  <NotificationToast />
                </POSSessionProvider>
              </SignalRProvider>
            </AuthProvider>
          </BrowserRouter>
          <UpdateNotification />
          <ReactQueryDevtools initialIsOpen={false} buttonPosition='bottom-left'/>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
