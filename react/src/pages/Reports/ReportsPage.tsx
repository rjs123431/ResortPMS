import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
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
  AccountsReceivableReportDto,
  OccupancyReportDto,
  RevenueReportDto,
  SalesReportDto,
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

const printDateTime = (iso: string) => new Date(iso).toLocaleString();

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderPrintWindow = (title: string, bodyMarkup: string) => {
  const printWindow = window.open('about:blank', '_blank', 'width=1200,height=900');
  if (!printWindow) {
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
        <style>
          :root {
            color-scheme: light;
            --border: #d1d5db;
            --text: #111827;
            --muted: #6b7280;
            --subtle: #f3f4f6;
            --surface: #ffffff;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #e5e7eb;
            color: var(--text);
            font-family: Arial, sans-serif;
          }

          .page {
            max-width: 1120px;
            margin: 0 auto;
            padding: 24px;
          }

          .toolbar {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-bottom: 16px;
          }

          .toolbar button {
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--text);
            border-radius: 8px;
            padding: 10px 14px;
            cursor: pointer;
            font-size: 14px;
          }

          .report {
            background: var(--surface);
            border: 1px solid var(--border);
            padding: 24px;
          }

          .report-header {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: flex-start;
            margin-bottom: 20px;
          }

          .report-title {
            margin: 0;
            font-size: 28px;
            line-height: 1.2;
          }

          .report-subtitle {
            margin: 6px 0 0;
            color: var(--muted);
            font-size: 14px;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
          }

          .summary-card {
            border: 1px solid var(--border);
            background: var(--surface);
            padding: 12px;
          }

          .summary-label {
            font-size: 12px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .summary-value {
            margin-top: 6px;
            font-size: 22px;
            font-weight: 700;
          }

          .section {
            margin-top: 24px;
          }

          .section h2 {
            margin: 0 0 10px;
            font-size: 16px;
          }

          .section-note {
            margin: 0 0 12px;
            color: var(--muted);
            font-size: 13px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }

          th,
          td {
            border: 1px solid var(--border);
            padding: 8px 10px;
            vertical-align: top;
          }

          thead th,
          tfoot td {
            background: var(--subtle);
            font-weight: 700;
          }

          .text-right {
            text-align: right;
          }

          .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 8px;
          }

          .details-card {
            border: 1px solid var(--border);
            background: #fafafa;
            padding: 10px;
          }

          .details-label {
            color: var(--muted);
            font-size: 12px;
          }

          .details-value {
            margin-top: 4px;
            font-weight: 700;
          }

          @media print {
            body {
              background: #ffffff;
            }

            .page {
              max-width: none;
              padding: 0;
            }

            .toolbar {
              display: none;
            }

            .report {
              border: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="toolbar">
            <button type="button" onclick="window.print()">Print</button>
            <button type="button" onclick="window.close()">Close</button>
          </div>
          <div class="report">${bodyMarkup}</div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
};

const openAccountsReceivablePrintWindow = (report: AccountsReceivableReportDto, asOfDate: string) => {
  const reservationTotal = report.reservations.reduce((sum, row) => sum + row.totalAmount, 0);
  const reservationDeposits = report.reservations.reduce((sum, row) => sum + row.depositPaid, 0);

  const chargeTypeRows = report.byChargeType.length > 0
    ? report.byChargeType.map((row) => `
        <tr>
          <td>${escapeHtml(row.chargeTypeName)}</td>
          <td class="text-right">${escapeHtml(formatCurrency(row.amount))}</td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="2">No accounts receivable found for the selected date.</td>
        </tr>
      `;

  const reservationRows = report.reservations.length > 0
    ? report.reservations.map((row) => `
        <tr>
          <td>${escapeHtml(row.reservationNo)}</td>
          <td>${escapeHtml(formatDate(row.arrivalDate))}</td>
          <td>${escapeHtml(row.guestName || '-')}</td>
          <td class="text-right">${escapeHtml(formatCurrency(row.totalAmount))}</td>
          <td class="text-right">${escapeHtml(formatCurrency(row.depositPaid))}</td>
          <td class="text-right">${escapeHtml(formatCurrency(row.balance))}</td>
        </tr>
        <tr>
          <td colspan="6">
            <div class="details-grid">
              <div class="details-card">
                <div class="details-label">Room amount</div>
                <div class="details-value">${escapeHtml(formatCurrency(row.roomAmount))}</div>
              </div>
              <div class="details-card">
                <div class="details-label">Extras amount</div>
                <div class="details-value">${escapeHtml(formatCurrency(row.extrasAmount))}</div>
              </div>
              <div class="details-card">
                <div class="details-label">Room balance</div>
                <div class="details-value">${escapeHtml(formatCurrency(row.roomBalance))}</div>
              </div>
              <div class="details-card">
                <div class="details-label">Extras balance</div>
                <div class="details-value">${escapeHtml(formatCurrency(row.extrasBalance))}</div>
              </div>
            </div>
          </td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="6">No open confirmed reservations.</td>
        </tr>
      `;

  const inHouseRows = report.inHouseStays.length > 0
    ? report.inHouseStays.map((row) => `
        <tr>
          <td>${escapeHtml(row.stayNo)}</td>
          <td>${escapeHtml(printDateTime(row.checkInDateTime))}</td>
          <td>${escapeHtml(row.guestName || '-')}</td>
          <td>${escapeHtml(row.roomNumber || '-')}</td>
          <td class="text-right">${escapeHtml(formatCurrency(row.charges))}</td>
          <td class="text-right">${escapeHtml(formatCurrency(row.balance))}</td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="6">No in-house receivables.</td>
        </tr>
      `;

  renderPrintWindow(
    `Accounts Receivable ${asOfDate}`,
    `
      <div class="report-header">
        <div>
          <h1 class="report-title">Accounts Receivable Report</h1>
          <p class="report-subtitle">As of ${escapeHtml(formatDate(asOfDate))}</p>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card"><div class="summary-label">Total Receivables</div><div class="summary-value">${escapeHtml(formatCurrency(report.totalReceivables))}</div></div>
        <div class="summary-card"><div class="summary-label">Reservation Balance</div><div class="summary-value">${escapeHtml(formatCurrency(report.reservationBalanceTotal))}</div></div>
        <div class="summary-card"><div class="summary-label">Reservation Room Balance</div><div class="summary-value">${escapeHtml(formatCurrency(report.reservationRoomBalanceTotal))}</div></div>
        <div class="summary-card"><div class="summary-label">Reservation Extras Balance</div><div class="summary-value">${escapeHtml(formatCurrency(report.reservationExtrasBalanceTotal))}</div></div>
        <div class="summary-card"><div class="summary-label">In-House Balance</div><div class="summary-value">${escapeHtml(formatCurrency(report.inHouseBalanceTotal))}</div></div>
        <div class="summary-card"><div class="summary-label">In-House Charges</div><div class="summary-value">${escapeHtml(formatCurrency(report.inHouseChargesTotal))}</div></div>
      </div>

      <div class="section">
        <h2>By Charge Type</h2>
        <p class="section-note">Reservation room and extras balances are derived from stored reservation room and extra-bed net amounts, with deposits allocated proportionally across both buckets.</p>
        <table>
          <thead>
            <tr>
              <th>Charge Type</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>${chargeTypeRows}</tbody>
        </table>
      </div>

      <div class="section">
        <h2>Confirmed Reservations</h2>
        <table>
          <thead>
            <tr>
              <th>Reservation</th>
              <th>Arrival</th>
              <th>Guest</th>
              <th class="text-right">Total</th>
              <th class="text-right">Deposit Paid</th>
              <th class="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>${reservationRows}</tbody>
          ${report.reservations.length > 0 ? `
            <tfoot>
              <tr>
                <td colspan="3" class="text-right">Subtotal</td>
                <td class="text-right">${escapeHtml(formatCurrency(reservationTotal))}</td>
                <td class="text-right">${escapeHtml(formatCurrency(reservationDeposits))}</td>
                <td class="text-right">${escapeHtml(formatCurrency(report.reservationBalanceTotal))}</td>
              </tr>
            </tfoot>
          ` : ''}
        </table>
      </div>

      <div class="section">
        <h2>In-House Stays</h2>
        <table>
          <thead>
            <tr>
              <th>Stay</th>
              <th>Check-In</th>
              <th>Guest</th>
              <th>Room</th>
              <th class="text-right">Charges</th>
              <th class="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>${inHouseRows}</tbody>
          ${report.inHouseStays.length > 0 ? `
            <tfoot>
              <tr>
                <td colspan="4" class="text-right">Subtotal</td>
                <td class="text-right">${escapeHtml(formatCurrency(report.inHouseChargesTotal))}</td>
                <td class="text-right">${escapeHtml(formatCurrency(report.inHouseBalanceTotal))}</td>
              </tr>
            </tfoot>
          ` : ''}
        </table>
      </div>
    `
  );
};

const openSalesPrintWindow = (report: SalesReportDto, from: string, to: string) => {
  const paymentMethodRows = report.byPaymentMethod.length > 0
    ? report.byPaymentMethod.map((row) => `
        <tr>
          <td>${escapeHtml(row.paymentMethodName)}</td>
          <td class="text-right">${escapeHtml(String(row.paymentsCount))}</td>
          <td class="text-right">${escapeHtml(formatCurrency(row.amount))}</td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="3">No payments found for the selected date range.</td>
        </tr>
      `;

  const paymentRows = report.payments.length > 0
    ? report.payments.map((payment) => `
        <tr>
          <td>${escapeHtml(printDateTime(payment.receivedAt))}</td>
          <td>${escapeHtml(payment.paymentMethodName || 'Unknown')}</td>
          <td>${escapeHtml(payment.sourceType || '-')}</td>
          <td>${escapeHtml(payment.documentNo || '-')}</td>
          <td>${escapeHtml(payment.description || '-')}</td>
          <td>${escapeHtml(payment.referenceNo || '-')}</td>
          <td class="text-right">${escapeHtml(formatCurrency(payment.amount))}</td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="7">No payments found for the selected date range.</td>
        </tr>
      `;

  renderPrintWindow(
    `Sales Report ${from} to ${to}`,
    `
      <div class="report-header">
        <div>
          <h1 class="report-title">Sales Report</h1>
          <p class="report-subtitle">From ${escapeHtml(formatDate(from))} to ${escapeHtml(formatDate(to))}</p>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card"><div class="summary-label">Payments Received</div><div class="summary-value">${escapeHtml(String(report.paymentsCount))}</div></div>
        <div class="summary-card"><div class="summary-label">Total Received</div><div class="summary-value">${escapeHtml(formatCurrency(report.totalPayments))}</div></div>
      </div>

      <div class="section">
        <h2>By Payment Method</h2>
        <p class="section-note">Includes collections from reservation deposits, check-in and arrival folio payments, and day-use payments.</p>
        <table>
          <thead>
            <tr>
              <th>Payment Method</th>
              <th class="text-right">Payments</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>${paymentMethodRows}</tbody>
        </table>
      </div>

      <div class="section">
        <h2>Payments</h2>
        <table>
          <thead>
            <tr>
              <th>Received</th>
              <th>Payment Method</th>
              <th>Source</th>
              <th>Document</th>
              <th>Description</th>
              <th>Reference</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>${paymentRows}</tbody>
          ${report.payments.length > 0 ? `
            <tfoot>
              <tr>
                <td colspan="6" class="text-right">Total</td>
                <td class="text-right">${escapeHtml(formatCurrency(report.totalPayments))}</td>
              </tr>
            </tfoot>
          ` : ''}
        </table>
      </div>
    `
  );
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

function AccountsReceivableTab() {
  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expandedReservations, setExpandedReservations] = useState<string[]>([]);
  const { data, isLoading } = useQuery({
    queryKey: ['reporting-accounts-receivable', asOfDate],
    queryFn: () => reportingService.getAccountsReceivableReport(asOfDate),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LogoSpinner sizeClassName="h-10 w-10" logoSizeClassName="h-6 w-6" />
      </div>
    );
  }

  const report = data as AccountsReceivableReportDto;
  const allReservationNos = report.reservations.map((row) => row.reservationNo);
  const areAllReservationsExpanded = report.reservations.length > 0 && expandedReservations.length === report.reservations.length;

  const toggleReservation = (reservationNo: string) => {
    setExpandedReservations((current) =>
      current.includes(reservationNo)
        ? current.filter((value) => value !== reservationNo)
        : [...current, reservationNo]
    );
  };

  const expandAllReservations = () => setExpandedReservations(allReservationNos);
  const collapseAllReservations = () => setExpandedReservations([]);

  const exportCsv = () => {
    downloadCsv(
      [
        ...report.reservations.map((row) => ({
          bucket: 'Reservation',
          documentNo: row.reservationNo,
          date: row.arrivalDate,
          guestName: row.guestName,
          roomNumber: '',
          roomAmount: row.roomAmount,
          extrasAmount: row.extrasAmount,
          charges: row.totalAmount,
          depositPaid: row.depositPaid,
          roomBalance: row.roomBalance,
          extrasBalance: row.extrasBalance,
          balance: row.balance,
        })),
        ...report.inHouseStays.map((row) => ({
          bucket: 'In House',
          documentNo: row.stayNo,
          date: row.checkInDateTime,
          guestName: row.guestName,
          roomNumber: row.roomNumber,
          roomAmount: '',
          extrasAmount: '',
          charges: row.charges,
          depositPaid: '',
          roomBalance: '',
          extrasBalance: '',
          balance: row.balance,
        })),
      ],
      `accounts-receivable-${asOfDate}.csv`,
      [
        { key: 'bucket', header: 'Bucket' },
        { key: 'documentNo', header: 'Document No' },
        { key: 'date', header: 'Date' },
        { key: 'guestName', header: 'Guest' },
        { key: 'roomNumber', header: 'Room' },
        { key: 'roomAmount', header: 'Room Amount' },
        { key: 'extrasAmount', header: 'Extras Amount' },
        { key: 'charges', header: 'Charges / Total' },
        { key: 'depositPaid', header: 'Deposit Paid' },
        { key: 'roomBalance', header: 'Room Balance' },
        { key: 'extrasBalance', header: 'Extras Balance' },
        { key: 'balance', header: 'Balance' },
      ]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">As of date</label>
          <DatePicker
            selected={asOfDate ? parseDateOnly(asOfDate) : null}
            onChange={(date: Date | null) => setAsOfDate(date ? toDateStr(date) : '')}
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
        <button
          type="button"
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
          onClick={() => openAccountsReceivablePrintWindow(report, asOfDate)}
        >
          Print
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded border border-gray-200 p-3 dark:border-gray-600 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total receivables</p>
          <p className="text-lg font-semibold">{formatCurrency(report.totalReceivables)}</p>
        </div>
        <div className="rounded border border-gray-200 p-3 dark:border-gray-600 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Reservation balance</p>
          <p className="text-lg font-semibold">{formatCurrency(report.reservationBalanceTotal)}</p>
        </div>
        <div className="rounded border border-gray-200 p-3 dark:border-gray-600 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Reservation room balance</p>
          <p className="text-lg font-semibold">{formatCurrency(report.reservationRoomBalanceTotal)}</p>
        </div>
        <div className="rounded border border-gray-200 p-3 dark:border-gray-600 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Reservation extras balance</p>
          <p className="text-lg font-semibold">{formatCurrency(report.reservationExtrasBalanceTotal)}</p>
        </div>
        <div className="rounded border border-gray-200 p-3 dark:border-gray-600 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">In-house balance</p>
          <p className="text-lg font-semibold">{formatCurrency(report.inHouseBalanceTotal)}</p>
        </div>
        <div className="rounded border border-gray-200 p-3 dark:border-gray-600 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">In-house charges</p>
          <p className="text-lg font-semibold">{formatCurrency(report.inHouseChargesTotal)}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        Reservation room and extras balances are derived from stored reservation room and extra-bed net amounts, with deposits allocated proportionally across both buckets.
      </p>

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
            {report.byChargeType.length === 0 && (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                  No accounts receivable found for the selected date.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Confirmed Reservations</h3>
          {report.reservations.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                onClick={expandAllReservations}
                disabled={areAllReservationsExpanded}
              >
                Expand all
              </button>
              <button
                type="button"
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                onClick={collapseAllReservations}
                disabled={expandedReservations.length === 0}
              >
                Collapse all
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-600">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="w-12 px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">View</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Reservation</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Arrival</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Guest</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Total</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Deposit Paid</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {report.reservations.map((row) => {
                const isExpanded = expandedReservations.includes(row.reservationNo);

                return (
                  <Fragment key={row.reservationNo}>
                    <tr>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          onClick={() => toggleReservation(row.reservationNo)}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Hide' : 'Show'} reservation details for ${row.reservationNo}`}
                        >
                          {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-3 py-2">{row.reservationNo}</td>
                      <td className="px-3 py-2">{formatDate(row.arrivalDate)}</td>
                      <td className="px-3 py-2">{row.guestName}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(row.totalAmount)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(row.depositPaid)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(row.balance)}</td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50/60 dark:bg-gray-700/30">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Room amount</p>
                              <p className="mt-1 text-sm font-semibold">{formatCurrency(row.roomAmount)}</p>
                            </div>
                            <div className="rounded border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Extras amount</p>
                              <p className="mt-1 text-sm font-semibold">{formatCurrency(row.extrasAmount)}</p>
                            </div>
                            <div className="rounded border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Room balance</p>
                              <p className="mt-1 text-sm font-semibold">{formatCurrency(row.roomBalance)}</p>
                            </div>
                            <div className="rounded border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Extras balance</p>
                              <p className="mt-1 text-sm font-semibold">{formatCurrency(row.extrasBalance)}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {report.reservations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                    No open confirmed reservations.
                  </td>
                </tr>
              )}
            </tbody>
            {report.reservations.length > 0 && (
              <tfoot className="print-subtle bg-gray-50 dark:bg-gray-700/60">
                <tr>
                  <td className="no-print px-3 py-2" />
                  <td colSpan={3} className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Subtotal</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(report.reservations.reduce((sum, row) => sum + row.totalAmount, 0))}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(report.reservations.reduce((sum, row) => sum + row.depositPaid, 0))}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(report.reservationBalanceTotal)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">In-House Stays</h3>
        <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-600">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Stay</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Check-In</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Guest</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Room</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Charges</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {report.inHouseStays.map((row) => (
                <tr key={row.stayNo}>
                  <td className="px-3 py-2">{row.stayNo}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(row.checkInDateTime).toLocaleString()}</td>
                  <td className="px-3 py-2">{row.guestName}</td>
                  <td className="px-3 py-2">{row.roomNumber || '-'}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(row.charges)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(row.balance)}</td>
                </tr>
              ))}
              {report.inHouseStays.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                    No in-house receivables.
                  </td>
                </tr>
              )}
            </tbody>
            {report.inHouseStays.length > 0 && (
              <tfoot className="print-subtle bg-gray-50 dark:bg-gray-700/60">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Subtotal</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(report.inHouseChargesTotal)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(report.inHouseBalanceTotal)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
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

function SalesTab() {
  const [from, setFrom] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const { data, isLoading } = useQuery({
    queryKey: ['reporting-sales', from, to],
    queryFn: () => reportingService.getSalesReport(from, to),
    enabled: from <= to,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LogoSpinner sizeClassName="h-10 w-10" logoSizeClassName="h-6 w-6" />
      </div>
    );
  }

  const report = data as SalesReportDto;
  const groupedPayments = report.payments.reduce<Record<string, SalesReportDto['payments']>>((groups, payment) => {
    const key = payment.paymentMethodName || 'Unknown';
    groups[key] = groups[key] ? [...groups[key], payment] : [payment];
    return groups;
  }, {});

  const exportCsv = () => {
    downloadCsv(
      report.payments.map((payment) => ({
        receivedAt: payment.receivedAt,
        paymentMethod: payment.paymentMethodName,
        sourceType: payment.sourceType,
        documentNo: payment.documentNo,
        description: payment.description,
        referenceNo: payment.referenceNo,
        amount: payment.amount,
      })),
      `sales-payments-${from}-${to}.csv`,
      [
        { key: 'receivedAt', header: 'Received At' },
        { key: 'paymentMethod', header: 'Payment Method' },
        { key: 'sourceType', header: 'Source' },
        { key: 'documentNo', header: 'Document No' },
        { key: 'description', header: 'Description' },
        { key: 'referenceNo', header: 'Reference No' },
        { key: 'amount', header: 'Amount' },
      ]
    );
  };

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
        <button
          type="button"
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
          onClick={() => openSalesPrintWindow(report, from, to)}
        >
          Print
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded border border-gray-200 p-3 dark:border-gray-600 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Payments received</p>
          <p className="text-lg font-semibold">{report.paymentsCount}</p>
        </div>
        <div className="rounded border border-gray-200 p-3 dark:border-gray-600 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total received</p>
          <p className="text-lg font-semibold">{formatCurrency(report.totalPayments)}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        Includes collections from reservation deposits, check-in and arrival folio payments, and day-use payments.
      </p>

      <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-600">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Payment method</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Payments</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {report.byPaymentMethod.map((row) => (
              <tr key={row.paymentMethodId}>
                <td className="px-3 py-2">{row.paymentMethodName}</td>
                <td className="px-3 py-2 text-right">{row.paymentsCount}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(row.amount)}</td>
              </tr>
            ))}
            {report.byPaymentMethod.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                  No payments found for the selected date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {Object.entries(groupedPayments).map(([paymentMethodName, payments]) => (
        <div key={paymentMethodName} className="space-y-2 rounded border border-gray-200 p-4 dark:border-gray-600 dark:bg-gray-800/50">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{paymentMethodName}</h3>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {formatCurrency(payments.reduce((sum, payment) => sum + payment.amount, 0))}
            </span>
          </div>
          <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-600">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Received</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Source</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Document</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Description</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Reference</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {payments.map((payment, index) => (
                  <tr key={`${paymentMethodName}-${payment.receivedAt}-${payment.documentNo}-${index}`}>
                    <td className="px-3 py-2 whitespace-nowrap">{new Date(payment.receivedAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{payment.sourceType}</td>
                    <td className="px-3 py-2">{payment.documentNo || '-'}</td>
                    <td className="px-3 py-2">{payment.description || '-'}</td>
                    <td className="px-3 py-2">{payment.referenceNo || '-'}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(payment.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'occupancy', label: 'Occupancy' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'accounts-receivable', label: 'Accounts Receivable' },
  { id: 'sales', label: 'Sales' },
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
              Dashboard KPIs, receivables, occupancy, revenue, sales and night audit.
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
            {activeTab === 'accounts-receivable' && <AccountsReceivableTab />}
            {activeTab === 'sales' && <SalesTab />}
            {activeTab === 'night-audit' && <NightAuditTab />}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};
