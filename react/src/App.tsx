import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, Outlet, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@contexts/AuthContext';
import { ThemeProvider } from '@contexts/ThemeContext';
import { SignalRProvider } from '@contexts/SignalRContext';
import { ProtectedRoute } from '@components/auth/ProtectedRoute';
import { AdminLayout } from '@components/layout/AdminLayout';
import { FrontDeskLayout } from '@components/layout/FrontDeskLayout';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { LogoSpinner } from '@components/common/LogoSpinner';
import UpdateNotification from '@components/common/UpdateNotification';
import { NotificationToast } from '@components/common/NotificationToast';
import { initAbpEvents } from '@/utils/abp-events';
import './index.css';
import { PermissionNames } from './config/permissionNames';
import { ImpersonatePage } from './pages/Impersonate/ImpersonatePage';
import { RoomRackPage } from '@/pages/Resort/RoomRack/RoomRackPage';

const LoginPage = lazy(() => import('@pages/Login/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@pages/Register/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('@pages/ForgotPassword/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@pages/ResetPassword/ResetPasswordPage').then((m) => ({ default: m.default })));
const ChangePasswordPage = lazy(() => import('@pages/ChangePassword/ChangePasswordPage').then((m) => ({ default: m.ChangePasswordPage })));
const ProfilePage = lazy(() => import('@pages/Profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const NotificationsPage = lazy(() => import('@pages/Notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const MyAccountPage = lazy(() => import('@pages/Devices/MyAccountPage').then((m) => ({ default: m.MyAccountPage })));

const GuestListPage = lazy(() => import('@pages/Resort/Guests/GuestsPage').then((m) => ({ default: m.GuestListPage })));
const RoomsPage = lazy(() => import('@pages/Resort/Rooms/RoomsPage').then((m) => ({ default: m.RoomListPage })));
const RoomTypeListPage = lazy(() => import('@pages/Resort/RoomTypes/RoomTypesPage').then((m) => ({ default: m.RoomTypeListPage })));
const RoomRatePlansPage = lazy(() => import('@pages/Resort/RoomRatePlans/RoomRatePlansPage').then((m) => ({ default: m.RoomRatePlansPage })));
const RoomRatePlanGroupEditorPage = lazy(() => import('@pages/Resort/RoomRatePlans/RoomRatePlanGroupEditorPage').then((m) => ({ default: m.RoomRatePlanGroupEditorPage })));
const ChargeTypeListPage = lazy(() => import('@pages/Resort/ChargeTypes/ChargeTypesPage').then((m) => ({ default: m.ChargeTypeListPage })));
const PaymentMethodListPage = lazy(() => import('@pages/Resort/PaymentMethods/PaymentMethodsPage').then((m) => ({ default: m.PaymentMethodListPage })));
const ChannelListPage = lazy(() => import('@pages/Resort/Channels/ChannelsPage').then((m) => ({ default: m.ChannelListPage })));
const AgencyListPage = lazy(() => import('@pages/Resort/Agencies/AgenciesPage').then((m) => ({ default: m.AgencyListPage })));
const ExtraBedTypeListPage = lazy(() => import('./pages/Resort/ExtraBedTypes/ExtraBedTypesPage').then((m) => ({ default: m.ExtraBedTypeListPage })));
const ExtraBedPricingPage = lazy(() => import('./pages/Resort/ExtraBedPricing/ExtraBedPricingPage').then((m) => ({ default: m.ExtraBedPricingPage })));
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
const QuotationsPage = lazy(() => import('@pages/Resort/Quotations/QuotationsPage').then((m) => ({ default: m.QuotationsPage })));
const PreCheckInsPage = lazy(() => import('@pages/Resort/PreCheckIns/PreCheckInsPage').then((m) => ({ default: m.PreCheckInsPage })));
const IncidentsPage = lazy(() => import('@pages/Resort/Incidents/IncidentsPage').then((m) => ({ default: m.IncidentsPage })));
const CleaningBoardPage = lazy(() => import('@pages/Resort/Housekeeping/CleaningBoardPage').then((m) => ({ default: m.CleaningBoardPage })));
const HousekeepingRoomStatusPage = lazy(() => import('@pages/Resort/Housekeeping/HousekeepingRoomStatusPage').then((m) => ({ default: m.HousekeepingRoomStatusPage })));
const HousekeepingTasksPage = lazy(() => import('@pages/Resort/Housekeeping/HousekeepingTasksPage').then((m) => ({ default: m.HousekeepingTasksPage })));
const MaintenanceHubPage = lazy(() => import('@pages/Resort/Maintenance/MaintenanceHubPage').then((m) => ({ default: m.MaintenanceHubPage })));
const WorkOrdersPage = lazy(() => import('@pages/Resort/Maintenance/WorkOrdersPage').then((m) => ({ default: m.WorkOrdersPage })));
const PreventiveMaintenancePage = lazy(() => import('@pages/Resort/Maintenance/PreventiveMaintenancePage').then((m) => ({ default: m.PreventiveMaintenancePage })));
const RepairHistoryPage = lazy(() => import('@pages/Resort/Maintenance/RepairHistoryPage').then((m) => ({ default: m.RepairHistoryPage })));
const ReportsPage = lazy(() => import('@pages/Reports/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const HomePage = lazy(() => import('@pages/Home/HomePage').then((m) => ({ default: m.HomePage })));
const FrontDeskDashboardPage = lazy(() =>
  import('@pages/Resort/FrontDesk/FrontDeskDashboardPage').then((m) => ({ default: m.FrontDeskDashboardPage })),
);
const HousekeepingHubPage = lazy(() => import('@pages/Resort/Housekeeping/HousekeepingHubPage').then((m) => ({ default: m.HousekeepingHubPage })));
const UsersPage = lazy(() => import('@pages/Administration/UsersPage').then((m) => ({ default: m.UsersPage })));
const RolesPage = lazy(() => import('@pages/Administration/RolesPage').then((m) => ({ default: m.RolesPage })));
const AuditTrailPage = lazy(() => import('@pages/Administration/AuditTrailPage').then((m) => ({ default: m.AuditTrailPage })));
const RoomRackSettingsPage = lazy(() => import('@pages/Administration/RoomRackSettingsPage').then((m) => ({ default: m.RoomRackSettingsPage })));
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

const RedirectToFrontDesk: React.FC = () => {
  const { pathname } = useLocation();
  return <Navigate to={`/front-desk${pathname}`} replace />;
};

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
                        <PageTitle title="Home">
                          <ProtectedRoute>
                            <HomePage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route path="/front-desk" element={<FrontDeskLayout><Outlet /></FrontDeskLayout>}>
                      <Route
                        index
                        element={
                          <PageTitle title="Front Desk">
                            <ProtectedRoute>
                              <FrontDeskDashboardPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="room-rack"
                        element={
                          <PageTitle title="Room Rack">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Rooms]}>
                              <RoomRackPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="reservations"
                        element={
                          <PageTitle title="Reservations">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Reservations]}>
                              <ReservationListPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="reservations/:id"
                        element={
                          <PageTitle title="Reservation Detail">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Reservations]}>
                              <ReservationDetailPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="reservations/new"
                        element={
                          <PageTitle title="New Reservation">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Reservations]}>
                              <ReservationPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="check-in"
                        element={
                          <PageTitle title="Check-In">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_CheckIn]}>
                              <CheckInPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="check-in/reservations/:reservationId"
                        element={
                          <PageTitle title="Check-In Reservation">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_CheckIn]}>
                              <CheckInReservationPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="walk-in/:preCheckInId?"
                        element={
                          <PageTitle title="Walk-In">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_CheckIn]}>
                              <CheckInWalkInPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="check-in/confirmation"
                        element={
                          <PageTitle title="Check-In Confirmation">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_CheckIn]}>
                              <CheckInConfirmationPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="stays"
                        element={
                          <PageTitle title="In-House Stays">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Stays]}>
                              <StaysPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="stays/:stayId"
                        element={
                          <PageTitle title="Stay Detail">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Stays]}>
                              <StayDetailPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="check-out"
                        element={
                          <PageTitle title="Check-Out">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_CheckOut]}>
                              <CheckOutListPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="check-out/:id"
                        element={
                          <PageTitle title="Check-Out">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_CheckOut]}>
                              <CheckOutPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="check-out/confirmation/:id"
                        element={
                          <PageTitle title="Check-Out Confirmation">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_CheckOut]}>
                              <CheckOutConfirmationPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="guests"
                        element={
                          <PageTitle title="Guests">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Guests]}>
                              <GuestListPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="pre-check-ins"
                        element={
                          <PageTitle title="Pre Check-In">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_CheckIn]}>
                              <PreCheckInsPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="incidents"
                        element={
                          <PageTitle title="Incidents">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Incidents]}>
                              <IncidentsPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                    </Route>
                    <Route path="/room-rack" element={<RedirectToFrontDesk />} />
                    <Route path="/room-rack/*" element={<RedirectToFrontDesk />} />
                    <Route path="/reservations/*" element={<RedirectToFrontDesk />} />
                    <Route path="/new-reservation" element={<Navigate to="/front-desk/reservations/new" replace />} />
                    <Route path="/check-in/*" element={<RedirectToFrontDesk />} />
                    <Route path="/stays/*" element={<RedirectToFrontDesk />} />
                    <Route path="/check-out/*" element={<RedirectToFrontDesk />} />
                    <Route path="/guests" element={<RedirectToFrontDesk />} />
                    <Route
                      path="/dashboard"
                      element={<Navigate to="/" replace />}
                    />
                    <Route
                      path="/reports"
                      element={
                        <PageTitle title="Reports">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Reports]}>
                            <ReportsPage />
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
                      path="/room-status"
                      element={<Navigate to="/front-desk/room-rack" replace />}
                    />
                    <Route
                      path="/housekeeping"
                      element={
                        <PageTitle title="Housekeeping">
                          <ProtectedRoute>
                            <HousekeepingHubPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
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
                      path="/housekeeping/room-maintenance"
                      element={<Navigate to="/maintenance/work-orders" replace />}
                    />
                    <Route
                      path="/maintenance"
                      element={
                        <PageTitle title="Maintenance">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Maintenance]}>
                            <MaintenanceHubPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/maintenance/work-orders"
                      element={
                        <PageTitle title="Work Orders">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Maintenance]}>
                            <WorkOrdersPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/maintenance/preventive"
                      element={
                        <PageTitle title="Preventive Maintenance">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Maintenance]}>
                            <PreventiveMaintenancePage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/maintenance/repair-history"
                      element={
                        <PageTitle title="Repair History">
                          <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Maintenance]}>
                            <RepairHistoryPage />
                          </ProtectedRoute>
                        </PageTitle>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute>
                          <AdminLayout>
                            <Outlet />
                          </AdminLayout>
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Navigate to="/admin/guests" replace />} />
                      <Route
                        path="guests"
                        element={
                          <PageTitle title="Guests">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Guests]}>
                              <GuestListPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="rooms"
                        element={
                          <PageTitle title="Rooms">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Rooms]}>
                              <RoomsPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="room-types"
                        element={
                          <PageTitle title="Room Types">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_RoomTypes]}>
                              <RoomTypeListPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="room-rate-plans"
                        element={
                          <PageTitle title="Room Rate Plans">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_RoomRatePlans]}>
                              <RoomRatePlansPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="room-rate-plans/new"
                        element={
                          <PageTitle title="New Room Rate Plan">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_RoomRatePlans_Create]}>
                              <RoomRatePlanGroupEditorPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="room-rate-plans/:groupCode/edit"
                        element={
                          <PageTitle title="Edit Room Rate Plan">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_RoomRatePlans_Edit]}>
                              <RoomRatePlanGroupEditorPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="charge-types"
                        element={
                          <PageTitle title="Charge Types">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_ChargeTypes]}>
                              <ChargeTypeListPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="payment-methods"
                        element={
                          <PageTitle title="Payment Methods">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_PaymentMethods]}>
                              <PaymentMethodListPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="channels"
                        element={
                          <PageTitle title="Channels">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Channels]}>
                              <ChannelListPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="agencies"
                        element={
                          <PageTitle title="Agencies">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Agencies]}>
                              <AgencyListPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="extra-bed-types"
                        element={
                          <PageTitle title="Extra Bed Types">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_ExtraBedTypes]}>
                              <ExtraBedTypeListPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="extra-bed-pricing"
                        element={
                          <PageTitle title="Extra Bed Pricing">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_ExtraBedPricings]}>
                              <ExtraBedPricingPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="staff"
                        element={
                          <PageTitle title="Staff">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Staff]}>
                              <StaffListPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="users"
                        element={
                          <PageTitle title="Users">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Admin_Users]}>
                              <UsersPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="roles"
                        element={
                          <PageTitle title="Roles">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Admin_Roles]}>
                              <RolesPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="audit-trail"
                        element={
                          <PageTitle title="Audit Trail">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Admin_AuditTrail]}>
                              <AuditTrailPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                      <Route
                        path="settings"
                        element={
                          <PageTitle title="Settings">
                            <ProtectedRoute requiredPermissions={[PermissionNames.Pages_Admin_Settings]}>
                              <RoomRackSettingsPage />
                            </ProtectedRoute>
                          </PageTitle>
                        }
                      />
                    </Route>
                    <Route path="/rooms" element={<Navigate to="/admin/rooms" replace />} />
                    <Route path="/room-types" element={<Navigate to="/admin/room-types" replace />} />
                    <Route path="/room-rate-plans" element={<Navigate to="/admin/room-rate-plans" replace />} />
                    <Route path="/charge-types" element={<Navigate to="/admin/charge-types" replace />} />
                    <Route path="/payment-methods" element={<Navigate to="/admin/payment-methods" replace />} />
                    <Route path="/channels" element={<Navigate to="/admin/channels" replace />} />
                    <Route path="/agencies" element={<Navigate to="/admin/agencies" replace />} />
                    <Route path="/extra-bed-types" element={<Navigate to="/admin/extra-bed-types" replace />} />
                    <Route path="/extra-bed-pricing" element={<Navigate to="/admin/extra-bed-pricing" replace />} />
                    <Route path="/staff" element={<Navigate to="/admin/staff" replace />} />
                    <Route path="/administration/users" element={<Navigate to="/admin/users" replace />} />
                    <Route path="/administration/roles" element={<Navigate to="/admin/roles" replace />} />
                    <Route path="/administration/audit-trail" element={<Navigate to="/admin/audit-trail" replace />} />
                    <Route path="/admin/reports" element={<Navigate to="/reports" replace />} />
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
