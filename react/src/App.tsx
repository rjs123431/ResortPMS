import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@contexts/AuthContext';
import { ThemeProvider } from '@contexts/ThemeContext';
import { SignalRProvider } from '@contexts/SignalRContext';
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
const DashboardPage = lazy(() => import('@pages/Dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ChangePasswordPage = lazy(() => import('@pages/ChangePassword/ChangePasswordPage').then((m) => ({ default: m.ChangePasswordPage })));
const ProfilePage = lazy(() => import('@pages/Profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const NotificationsPage = lazy(() => import('@pages/Notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const MyAccountPage = lazy(() => import('@pages/Devices/MyAccountPage').then((m) => ({ default: m.MyAccountPage })));

const GuestListPage = lazy(() => import('@pages/Resort/Guests/GuestsPage').then((m) => ({ default: m.GuestListPage })));
const RoomsPage = lazy(() => import('@pages/Resort/Rooms/RoomsPage').then((m) => ({ default: m.RoomListPage })));
const RoomTypeListPage = lazy(() => import('@pages/Resort/RoomTypes/RoomTypesPage').then((m) => ({ default: m.RoomTypeListPage })));
const ChargeTypeListPage = lazy(() => import('@pages/Resort/ChargeTypes/ChargeTypesPage').then((m) => ({ default: m.ChargeTypeListPage })));
const PaymentMethodListPage = lazy(() => import('@pages/Resort/PaymentMethods/PaymentMethodsPage').then((m) => ({ default: m.PaymentMethodListPage })));
const ExtraBedTypeListPage = lazy(() => import('./pages/Resort/ExtraBedTypes/ExtraBedTypesPage').then((m) => ({ default: m.ExtraBedTypeListPage })));
const ReservationListPage = lazy(() => import('@pages/Resort/Reservations/ReservationsPage').then((m) => ({ default: m.ReservationListPage })));
const NewReservationPage = lazy(() => import('@pages/Resort/Reservations/NewReservationPage').then((m) => ({ default: m.NewReservationPage })));
const ReservationDetailPage = lazy(() => import('@pages/Resort/Reservations/ReservationDetailPage').then((m) => ({ default: m.ReservationDetailPage })));
const ReservationPage = lazy(() => import('@pages/Resort/Reservations/ReservationPage').then((m) => ({ default: m.ReservationPage })));
const CheckInPage = lazy(() => import('@pages/Resort/CheckIn/CheckInPage').then((m) => ({ default: m.CheckInPage })));
const CheckInReservationPage = lazy(() => import('./pages/Resort/CheckIn/CheckInReservationPage').then((m) => ({ default: m.CheckInReservationPage })));
const StaysPage = lazy(() => import('@pages/Resort/Stays/StaysPage').then((m) => ({ default: m.StaysPage })));
const CheckOutPage = lazy(() => import('@pages/Resort/CheckOut/CheckOutPage').then((m) => ({ default: m.CheckOutPage })));

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
    document.title = `${title} - PMS`;
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
                        <PageTitle title="Dashboard">
                          <ProtectedRoute>
                            <DashboardPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <PageTitle title="Dashboard">
                          <ProtectedRoute>
                            <DashboardPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <PageTitle title="Profile">
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/change-password"
                      element={
                        <PageTitle title="Change Password">
                          <ProtectedRoute>
                            <ChangePasswordPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/notifications"
                      element={
                        <PageTitle title="Notifications">
                          <ProtectedRoute>
                            <NotificationsPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/my-account"
                      element={
                        <PageTitle title="My Account">
                          <ProtectedRoute>
                            <MyAccountPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/guests"
                      element={
                        <PageTitle title="Guests">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Guests]}>
                            <GuestListPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/rooms"
                      element={
                        <PageTitle title="Rooms">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Rooms]}>
                            <RoomsPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/room-types"
                      element={
                        <PageTitle title="Room Types">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_RoomTypes]}>
                            <RoomTypeListPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/charge-types"
                      element={
                        <PageTitle title="Charge Types">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_ChargeTypes]}>
                            <ChargeTypeListPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/payment-methods"
                      element={
                        <PageTitle title="Payment Methods">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_PaymentMethods]}>
                            <PaymentMethodListPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/extra-bed-types"
                      element={
                        <PageTitle title="Extra Bed Types">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_ExtraBedTypes]}>
                            <ExtraBedTypeListPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/reservations"
                      element={
                        <PageTitle title="Reservations">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Reservations]}>
                            <ReservationListPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/reservations/:id"
                      element={
                        <PageTitle title="Reservation Detail">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Reservations]}>
                            <ReservationDetailPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/reservations/new"
                      element={
                        <PageTitle title="New Reservation">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Reservations]}>
                            <NewReservationPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/find-available-rooms"
                      element={
                        <PageTitle title="Find Available Rooms">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Reservations]}>
                            <ReservationPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/check-in"
                      element={
                        <PageTitle title="Check-In">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_CheckIn]}>
                            <CheckInPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/check-in/reservations/:reservationId"
                      element={
                        <PageTitle title="Check-In Reservation">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_CheckIn]}>
                            <CheckInReservationPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/stays"
                      element={
                        <PageTitle title="In-House Stays">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Stays]}>
                            <StaysPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/check-out"
                      element={
                        <PageTitle title="Check-Out">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_CheckOut]}>
                            <CheckOutPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
                <NotificationToast />
              </SignalRProvider>
            </AuthProvider>
          </BrowserRouter>
          <UpdateNotification />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
