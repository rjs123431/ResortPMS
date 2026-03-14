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
import { ImpersonatePage } from './pages/Impersonate/ImpersonatePage';

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
const RoomRatePlansPage = lazy(() => import('@pages/Resort/RoomRatePlans/RoomRatePlansPage').then((m) => ({ default: m.RoomRatePlansPage })));
const ChargeTypeListPage = lazy(() => import('@pages/Resort/ChargeTypes/ChargeTypesPage').then((m) => ({ default: m.ChargeTypeListPage })));
const PaymentMethodListPage = lazy(() => import('@pages/Resort/PaymentMethods/PaymentMethodsPage').then((m) => ({ default: m.PaymentMethodListPage })));
const ExtraBedTypeListPage = lazy(() => import('./pages/Resort/ExtraBedTypes/ExtraBedTypesPage').then((m) => ({ default: m.ExtraBedTypeListPage })));
const StaffListPage = lazy(() => import('@pages/Resort/Staff/StaffPage').then((m) => ({ default: m.StaffListPage })));
const ReservationListPage = lazy(() => import('@pages/Resort/Reservations/ReservationsPage').then((m) => ({ default: m.ReservationListPage })));
const ReservationDetailPage = lazy(() => import('@pages/Resort/Reservations/ReservationDetailPage').then((m) => ({ default: m.ReservationDetailPage })));
const ReservationPage = lazy(() => import('@pages/Resort/Reservations/ReservationPage').then((m) => ({ default: m.ReservationPage })));
const CheckInPage = lazy(() => import('@pages/Resort/CheckIn/CheckInPage').then((m) => ({ default: m.CheckInPage })));
const CheckInWalkInPage = lazy(() => import('@pages/Resort/CheckIn/CheckInWalkInPage').then((m) => ({ default: m.CheckInWalkInPage })));
const CheckInReservationPage = lazy(() => import('./pages/Resort/CheckIn/CheckInReservationPage').then((m) => ({ default: m.CheckInReservationPage })));
const CheckInConfirmationPage = lazy(() => import('@pages/Resort/CheckIn/CheckInConfirmationPage').then((m) => ({ default: m.CheckInConfirmationPage })));
const StaysPage = lazy(() => import('@pages/Resort/Stays/StaysPage').then((m) => ({ default: m.StaysPage })));
const StayDetailPage = lazy(() => import('@pages/Resort/Stays/StayDetailPage').then((m) => ({ default: m.StayDetailPage })));
const CheckOutListPage = lazy(() => import('@pages/Resort/CheckOut/CheckOutListPage').then((m) => ({ default: m.CheckOutListPage })));
const CheckOutPage = lazy(() => import('@pages/Resort/CheckOut/CheckOutPage').then((m) => ({ default: m.CheckOutPage })));
const CheckOutConfirmationPage = lazy(() => import('@pages/Resort/CheckOut/CheckOutConfirmationPage').then((m) => ({ default: m.CheckOutConfirmationPage })));
const RoomRackPage = lazy(() => import('@pages/Resort/RoomRack/RoomRackPage').then((m) => ({ default: m.RoomRackPage })));
const FrontDeskGridPage = lazy(() => import('@pages/Resort/FrontDesk/FrontDeskGridPage').then((m) => ({ default: m.FrontDeskGridPage })));
const CleaningBoardPage = lazy(() => import('@pages/Resort/Housekeeping/CleaningBoardPage').then((m) => ({ default: m.CleaningBoardPage })));
const HousekeepingRoomStatusPage = lazy(() => import('@pages/Resort/Housekeeping/HousekeepingRoomStatusPage').then((m) => ({ default: m.HousekeepingRoomStatusPage })));
const HousekeepingTasksPage = lazy(() => import('@pages/Resort/Housekeeping/HousekeepingTasksPage').then((m) => ({ default: m.HousekeepingTasksPage })));
const POSOrderPage = lazy(() => import('@pages/Resort/POS/POSOrderPage').then((m) => ({ default: m.POSOrderPage })));
const POSPage = lazy(() => import('@pages/Resort/POS/POSPage').then((m) => ({ default: m.POSPage })));
const POSTablesPage = lazy(() => import('@pages/Resort/POS/POSTablesPage').then((m) => ({ default: m.POSTablesPage })));
const POSOrdersPage = lazy(() => import('@pages/Resort/POS/POSOrdersPage').then((m) => ({ default: m.POSOrdersPage })));
const POSReportsPage = lazy(() => import('@pages/Resort/POS/POSReportsPage').then((m) => ({ default: m.POSReportsPage })));
const POSSettingsPage = lazy(() => import('@pages/Resort/POS/POSSettingsPage').then((m) => ({ default: m.POSSettingsPage })));
const PosOutletsPage = lazy(() => import('@pages/Resort/POS/PosOutletsPage').then((m) => ({ default: m.PosOutletsPage })));
const PosMenuPage = lazy(() => import('@pages/Resort/POS/PosMenuPage').then((m) => ({ default: m.PosMenuPage })));
const PosOptionGroupsPage = lazy(() => import('@pages/Resort/POS/PosOptionGroupsPage').then((m) => ({ default: m.PosOptionGroupsPage })));
const PosPriceAdjustmentsPage = lazy(() => import('@pages/Resort/POS/PosPriceAdjustmentsPage').then((m) => ({ default: m.PosPriceAdjustmentsPage })));
const PosPromosPage = lazy(() => import('@pages/Resort/POS/PosPromosPage').then((m) => ({ default: m.PosPromosPage })));
const UsersPage = lazy(() => import('@pages/Administration/UsersPage').then((m) => ({ default: m.UsersPage })));
const RolesPage = lazy(() => import('@pages/Administration/RolesPage').then((m) => ({ default: m.RolesPage })));

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
                      path="/room-rate-plans"
                      element={
                        <PageTitle title="Room Rate Plans">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_RoomRatePlans]}>
                            <RoomRatePlansPage />
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
                      path="/staff"
                      element={
                        <PageTitle title="Staff">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Staff]}>
                            <StaffListPage />
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
                            <ReservationPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/new-reservation"
                      element={
                        <PageTitle title="New Reservation">
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
                      path="/check-in/walk-in/:preCheckInId?"
                      element={
                        <PageTitle title="Walk-In Check-In">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_CheckIn]}>
                            <CheckInWalkInPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/check-in/confirmation"
                      element={
                        <PageTitle title="Check-In Confirmation">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_CheckIn]}>
                            <CheckInConfirmationPage />
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
                      path="/stays/:stayId"
                      element={
                        <PageTitle title="Stay Detail">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Stays]}>
                            <StayDetailPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/check-out"
                      element={
                        <PageTitle title="Check-Out">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_CheckOut]}>
                            <CheckOutListPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/check-out/:id"
                      element={
                        <PageTitle title="Check-Out">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_CheckOut]}>
                            <CheckOutPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/check-out/confirmation/:id"
                      element={
                        <PageTitle title="Check-Out Confirmation">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_CheckOut]}>
                            <CheckOutConfirmationPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/room-rack"
                      element={
                        <PageTitle title="Room Rack">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Rooms]}>
                            <RoomRackPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/front-desk/grid"
                      element={
                        <PageTitle title="Front Desk Grid">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Reservations]}>
                            <FrontDeskGridPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/room-status"
                      element={<Navigate to="/room-rack" replace />}
                    />
                    <Route
                      path="/housekeeping/cleaning-board"
                      element={
                        <PageTitle title="Cleaning Board">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Rooms]}>
                            <CleaningBoardPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/housekeeping/room-status"
                      element={
                        <PageTitle title="Housekeeping Room Status">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Rooms]}>
                            <HousekeepingRoomStatusPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/housekeeping/tasks"
                      element={
                        <PageTitle title="Housekeeping Tasks">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Rooms]}>
                            <HousekeepingTasksPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/pos"
                      element={
                        <PageTitle title="POS">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                            <POSPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/pos/order/:orderId"
                      element={
                        <PageTitle title="POS">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                            <POSOrderPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/pos/tables"
                      element={
                        <PageTitle title="POS Tables">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                            <POSTablesPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/pos/orders"
                      element={
                        <PageTitle title="POS Orders">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                            <POSOrdersPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/pos/reports"
                      element={
                        <PageTitle title="POS Reports">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                            <POSReportsPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/pos/settings"
                      element={
                        <PageTitle title="POS Settings">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                            <POSSettingsPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/pos/outlets"
                      element={
                        <PageTitle title="POS Outlets">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                            <PosOutletsPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/pos/menu"
                      element={
                        <PageTitle title="POS Menu">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                            <PosMenuPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/pos/option-groups"
                      element={
                        <PageTitle title="POS Option Groups">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                            <PosOptionGroupsPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/pos/price-adjustments"
                      element={
                        <PageTitle title="POS Price Adjustments">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                            <PosPriceAdjustmentsPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/pos/promos"
                      element={
                        <PageTitle title="POS Promos">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_POS]}>
                            <PosPromosPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/administration/users"
                      element={
                        <PageTitle title="Users">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Admin_Users]}>
                            <UsersPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/administration/roles"
                      element={
                        <PageTitle title="Roles">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Admin_Roles]}>
                            <RolesPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/xx"
                      element={
                        <PageTitle title="Impersonate">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Admin_Users]}>
                            <ImpersonatePage />
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
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
