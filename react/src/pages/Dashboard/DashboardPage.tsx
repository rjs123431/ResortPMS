import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';
import { reportingService } from '@services/reporting.service';
import type { DashboardKpisDto } from '@services/reporting.service';
import { LogoSpinner } from '@components/common/LogoSpinner';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

type RoomAvailabilitySample = {
  roomType: string;
  totalRooms: number;
  occupied: number;
  available: number;
  avgRate: string;
};

const sampleRoomAvailability: RoomAvailabilitySample[] = [
  { roomType: 'Deluxe King', totalRooms: 24, occupied: 18, available: 6, avgRate: '$185' },
  { roomType: 'Ocean View Suite', totalRooms: 12, occupied: 9, available: 3, avgRate: '$320' },
  { roomType: 'Family Villa', totalRooms: 8, occupied: 5, available: 3, avgRate: '$410' },
  { roomType: 'Standard Twin', totalRooms: 20, occupied: 11, available: 9, avgRate: '$145' },
];

export const DashboardPage: React.FC = () => {
  const { isGranted } = useAuth();
  const hasReports = isGranted(PermissionNames.Pages_Reports);
  const today = new Date().toISOString().slice(0, 10);
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['dashboard-kpis', today],
    queryFn: () => reportingService.getDashboardKpis(today),
    enabled: hasReports,
  });

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {hasReports ? 'Live KPIs and operational overview' : 'Sample Resort PMS operational data'}
          </p>
        </div>

        {hasReports && isLoading && (
          <div className="flex justify-center py-12">
            <LogoSpinner sizeClassName="h-10 w-10" logoSizeClassName="h-6 w-6" />
          </div>
        )}

        {hasReports && !isLoading && kpis && (
          <LiveKpiCards kpis={kpis} />
        )}

        {(!hasReports || !kpis) && !isLoading && (
          <SampleKpiCards />
        )}

        <div className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Room Availability Snapshot</h2>
          </div>
          <div className="overflow-x-auto -mx-px">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px]">Room Type</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">Total Rooms</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">Occupied</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[90px]">Available</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[90px]">Avg Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sampleRoomAvailability.map((room) => (
                  <tr key={room.roomType} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900 dark:text-white">{room.roomType}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 dark:text-gray-400">{room.totalRooms}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 dark:text-gray-400">{room.occupied}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">{room.available}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 dark:text-gray-400">{room.avgRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

function LiveKpiCards({ kpis }: { kpis: DashboardKpisDto }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Arrivals</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{kpis.arrivalsToday}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Departures</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{kpis.departuresToday}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">In-House Stays</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{kpis.inHouseStays}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Occupancy</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{kpis.occupancyPercent}%</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 col-span-2 lg:col-span-1">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Revenue Today</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(kpis.totalRevenueToday)}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Room Revenue</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(kpis.roomRevenueToday)}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Payments Today</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(kpis.paymentsToday)}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">ADR</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(kpis.adr)}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">RevPAR</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(kpis.revPar)}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Reservations Today</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{kpis.reservationsToday}</p>
      </div>
    </div>
  );
}

function SampleKpiCards() {
  const sample = {
    arrivals: 14,
    departures: 10,
    inHouseGuests: 126,
    occupancyRate: '67%',
    projectedRevenue: '$21,480',
  };
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Arrivals</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{sample.arrivals}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Departures</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{sample.departures}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">In-House Guests</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{sample.inHouseGuests}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Occupancy</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{sample.occupancyRate}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 col-span-2 lg:col-span-1">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Projected Revenue</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{sample.projectedRevenue}</p>
      </div>
    </div>
  );
}
