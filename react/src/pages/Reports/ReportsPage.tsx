import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { reportingService } from '@services/reporting.service';
import type {
  DashboardKpisDto,
  OccupancyReportDto,
  RevenueReportDto,
  NightAuditSummaryDto,
} from '@services/reporting.service';
import { LogoSpinner } from '@components/common/LogoSpinner';
import { downloadCsv } from '@utils/csvExport';
import { formatMoney } from '@utils/helpers';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const toDateStr = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'short' });
}
const formatCurrency = (n: number) => formatMoney(n);

function DashboardTab() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, isLoading } = useQuery({
    queryKey: ['reporting-dashboard', today],
    queryFn: () => reportingService.getDashboardKpis(today),
  });
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LogoSpinner sizeClassName="h-10 w-10" logoSizeClassName="h-6 w-6" />
      </div>
    );
  }
  const kpis = data as DashboardKpisDto;
  const cards = [
    { label: 'Total Rooms', value: kpis.totalRooms },
    { label: 'In-House Rooms', value: kpis.inHouseRooms },
    { label: 'In-House Stays', value: kpis.inHouseStays },
    { label: 'Arrivals Today', value: kpis.arrivalsToday },
    { label: 'Departures Today', value: kpis.departuresToday },
    { label: 'Reservations Today', value: kpis.reservationsToday },
    { label: 'No-Shows Today', value: kpis.noShowsToday },
    { label: 'Cancellations Today', value: kpis.cancellationsToday },
    { label: 'Occupancy %', value: `${kpis.occupancyPercent}%` },
    { label: 'ADR (30d)', value: formatCurrency(kpis.adr) },
    { label: 'RevPAR (30d)', value: formatCurrency(kpis.revPar) },
    { label: 'Room Revenue Today', value: formatCurrency(kpis.roomRevenueToday) },
    { label: 'Total Revenue Today', value: formatCurrency(kpis.totalRevenueToday) },
    { label: 'Payments Today', value: formatCurrency(kpis.paymentsToday) },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-800"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{c.label}</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function OccupancyTab() {
  const [from, setFrom] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const { data, isLoading } = useQuery({
    queryKey: ['reporting-occupancy', from, to],
    queryFn: () => reportingService.getOccupancyReport(from, to),
    enabled: from <= to,
  });
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LogoSpinner sizeClassName="h-10 w-10" logoSizeClassName="h-6 w-6" />
      </div>
    );
  }
  const report = data as OccupancyReportDto;
  const exportCsv = () => {
    const rows = report.byDay.map((row) => ({
      date: formatDate(row.date),
      roomsOccupied: row.roomsOccupied,
      roomsAvailable: row.roomsAvailable,
      occupancyPercent: row.occupancyPercent,
    }));
    downloadCsv(rows, `occupancy-${from}-${to}.csv`, [
      { key: 'date', header: 'Date' },
      { key: 'roomsOccupied', header: 'Rooms Occupied' },
      { key: 'roomsAvailable', header: 'Rooms Available' },
      { key: 'occupancyPercent', header: 'Occupancy %' },
    ]);
  };
  const chartData = report.byDay.map((row) => ({
    date: formatDate(row.date),
    occupancy: row.occupancyPercent,
    occupied: row.roomsOccupied,
  }));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">From</label>
          <DatePicker
            selected={from ? parseDateOnly(from) : null}
            onChange={(date: Date | null) => setFrom(date ? toDateStr(date) : '')}
            dateFormat="MMM d, yyyy"
            className="rounded border border-gray-300 px-3 py-1.5 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">To</label>
          <DatePicker
            selected={to ? parseDateOnly(to) : null}
            onChange={(date: Date | null) => setTo(date ? toDateStr(date) : '')}
            dateFormat="MMM d, yyyy"
            className="rounded border border-gray-300 px-3 py-1.5 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <button
          type="button"
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
          onClick={exportCsv}
        >
          Export CSV
        </button>
      </div>
      <div className="rounded border border-gray-200 dark:border-gray-600 p-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Total rooms: <strong>{report.totalRooms}</strong> · Room-nights available: <strong>{report.totalRoomNightsAvailable}</strong> · Sold: <strong>{report.roomNightsSold}</strong> · Occupancy: <strong>{report.occupancyPercent}%</strong>
        </p>
      </div>
      {chartData.length > 0 && (
        <div className="h-64 w-full rounded border border-gray-200 dark:border-gray-600 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v ?? 0, '']} labelFormatter={(l) => `Date: ${l}`} />
              <Bar dataKey="occupancy" name="Occupancy %" fill="var(--color-primary-500, #6366f1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-600">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Date</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Occupied</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Available</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {report.byDay.map((row) => (
              <tr key={row.date}>
                <td className="px-3 py-2">{formatDate(row.date)}</td>
                <td className="px-3 py-2 text-right">{row.roomsOccupied}</td>
                <td className="px-3 py-2 text-right">{row.roomsAvailable}</td>
                <td className="px-3 py-2 text-right">{row.occupancyPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RevenueTab() {
  const [from, setFrom] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const { data, isLoading } = useQuery({
    queryKey: ['reporting-revenue', from, to],
    queryFn: () => reportingService.getRevenueReport(from, to),
    enabled: from <= to,
  });
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LogoSpinner sizeClassName="h-10 w-10" logoSizeClassName="h-6 w-6" />
      </div>
    );
  }
  const report = data as RevenueReportDto;
  const exportCsv = () => {
    const rows = report.byDay.map((row) => ({
      date: formatDate(row.date),
      charges: row.charges,
      payments: row.payments,
    }));
    downloadCsv(rows, `revenue-${from}-${to}.csv`, [
      { key: 'date', header: 'Date' },
      { key: 'charges', header: 'Charges' },
      { key: 'payments', header: 'Payments' },
    ]);
  };
  const chartData = report.byDay.map((row) => ({
    date: formatDate(row.date),
    charges: row.charges,
    payments: row.payments,
  }));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">From</label>
          <DatePicker
            selected={from ? parseDateOnly(from) : null}
            onChange={(date: Date | null) => setFrom(date ? toDateStr(date) : '')}
            dateFormat="MMM d, yyyy"
            className="rounded border border-gray-300 px-3 py-1.5 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">To</label>
          <DatePicker
            selected={to ? parseDateOnly(to) : null}
            onChange={(date: Date | null) => setTo(date ? toDateStr(date) : '')}
            dateFormat="MMM d, yyyy"
            className="rounded border border-gray-300 px-3 py-1.5 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <button
          type="button"
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
          onClick={exportCsv}
        >
          Export CSV
        </button>
      </div>
      <div className="rounded border border-gray-200 dark:border-gray-600 p-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Total charges: <strong>{formatCurrency(report.totalCharges)}</strong> · Total payments: <strong>{formatCurrency(report.totalPayments)}</strong> · Discounts: <strong>{formatCurrency(report.totalDiscounts)}</strong>
        </p>
      </div>
      {chartData.length > 0 && (
        <div className="h-64 w-full rounded border border-gray-200 dark:border-gray-600 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
              <Tooltip formatter={(v) => [formatCurrency(Number(v ?? 0)), '']} labelFormatter={(l) => `Date: ${l}`} />
              <Legend />
              <Line type="monotone" dataKey="charges" name="Charges" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="payments" name="Payments" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-600">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Date</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Charges</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Payments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {report.byDay.map((row) => (
              <tr key={row.date}>
                <td className="px-3 py-2">{formatDate(row.date)}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(row.charges)}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(row.payments)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {report.byChargeType.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">By charge type</h3>
          <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-600">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Charge type</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {report.byChargeType.map((row) => (
                  <tr key={row.chargeTypeName}>
                    <td className="px-3 py-2">{row.chargeTypeName}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function NightAuditTab() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { data, isLoading } = useQuery({
    queryKey: ['reporting-night-audit', date],
    queryFn: () => reportingService.getNightAuditSummary(date),
  });
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LogoSpinner sizeClassName="h-10 w-10" logoSizeClassName="h-6 w-6" />
      </div>
    );
  }
  const report = data as NightAuditSummaryDto;
  const exportCsv = () => {
    downloadCsv(
      report.folioSummary.map((row) => ({
        stayNo: row.stayNo,
        guestName: row.guestName,
        roomNumber: row.roomNumber,
        charges: row.charges,
        payments: row.payments,
        balance: row.balance,
      })),
      `night-audit-${date}.csv`,
      [
        { key: 'stayNo', header: 'Stay #' },
        { key: 'guestName', header: 'Guest' },
        { key: 'roomNumber', header: 'Room' },
        { key: 'charges', header: 'Charges' },
        { key: 'payments', header: 'Payments' },
        { key: 'balance', header: 'Balance' },
      ]
    );
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Audit date</label>
          <DatePicker
            selected={date ? parseDateOnly(date) : null}
            onChange={(d: Date | null) => setDate(d ? toDateStr(d) : '')}
            dateFormat="MMM d, yyyy"
            className="rounded border border-gray-300 px-3 py-1.5 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <button
          type="button"
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
          onClick={exportCsv}
        >
          Export CSV
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded border border-gray-200 p-3 dark:border-gray-600 dark:bg-gray-800"><p className="text-xs text-gray-500 dark:text-gray-400">Arrivals</p><p className="text-lg font-semibold">{report.arrivals}</p></div>
        <div className="rounded border border-gray-200 p-3 dark:border-gray-600 dark:bg-gray-800"><p className="text-xs text-gray-500 dark:text-gray-400">Departures</p><p className="text-lg font-semibold">{report.departures}</p></div>
        <div className="rounded border border-gray-200 p-3 dark:border-gray-600 dark:bg-gray-800"><p className="text-xs text-gray-500 dark:text-gray-400">In-house (start)</p><p className="text-lg font-semibold">{report.inHouseAtStart}</p></div>
        <div className="rounded border border-gray-200 p-3 dark:border-gray-600 dark:bg-gray-800"><p className="text-xs text-gray-500 dark:text-gray-400">In-house (end)</p><p className="text-lg font-semibold">{report.inHouseAtEnd}</p></div>
        <div className="rounded border border-gray-200 p-3 dark:border-gray-600 dark:bg-gray-800"><p className="text-xs text-gray-500 dark:text-gray-400">Room revenue</p><p className="text-lg font-semibold">{formatCurrency(report.roomRevenue)}</p></div>
        <div className="rounded border border-gray-200 p-3 dark:border-gray-600 dark:bg-gray-800"><p className="text-xs text-gray-500 dark:text-gray-400">Total payments</p><p className="text-lg font-semibold">{formatCurrency(report.totalPayments)}</p></div>
        <div className="rounded border border-gray-200 p-3 dark:border-gray-600 dark:bg-gray-800 col-span-2"><p className="text-xs text-gray-500 dark:text-gray-400">Outstanding balance</p><p className="text-lg font-semibold">{formatCurrency(report.outstandingBalance)}</p></div>
      </div>
      <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-600">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Stay #</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Guest</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Room</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Charges</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Payments</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {report.folioSummary.map((row, i) => (
              <tr key={i}>
                <td className="px-3 py-2">{row.stayNo}</td>
                <td className="px-3 py-2">{row.guestName}</td>
                <td className="px-3 py-2">{row.roomNumber}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(row.charges)}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(row.payments)}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'occupancy', label: 'Occupancy' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'night-audit', label: 'Night Audit' },
] as const;

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('dashboard');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports &amp; Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dashboard KPIs, occupancy, revenue and night audit.
            </p>
          </div>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <nav className="-mb-px flex gap-4 border-b border-gray-200 dark:border-gray-600">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`border-b-2 px-1 py-3 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="pt-4">
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'occupancy' && <OccupancyTab />}
            {activeTab === 'revenue' && <RevenueTab />}
            {activeTab === 'night-audit' && <NightAuditTab />}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};
