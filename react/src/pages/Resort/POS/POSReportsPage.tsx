import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { POSLayout } from '@components/layout/POSLayout';
import { POSSidebar } from '@components/layout/POSSidebar';
import { reportingService } from '@services/reporting.service';
import type {
  PosSalesSummaryDto,
  PosZReportDto,
} from '@services/reporting.service';
import { posService } from '@services/pos.service';
import { LogoSpinner } from '@components/common/LogoSpinner';
import { formatCurrency } from '@utils/helpers';
import { downloadCsv } from '@utils/csvExport';

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

type TabId = 'sales' | 'zreport';

export const POSReportsPage = () => {
  const [tab, setTab] = useState<TabId>('sales');
  return (
    <POSLayout sidebar={<POSSidebar />}>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            POS Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sales summary, Z-Report, and End-of-Day summary.
          </p>
        </div>
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-600">
          <button
            type="button"
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === 'sales'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
            onClick={() => setTab('sales')}
          >
            Sales Summary
          </button>
          <button
            type="button"
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === 'zreport'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
            onClick={() => setTab('zreport')}
          >
            Z-Report / EOD
          </button>
        </div>
        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          {tab === 'sales' && <SalesSummaryTab />}
          {tab === 'zreport' && <ZReportEodTab />}
        </div>
      </div>
    </POSLayout>
  );
};

function SalesSummaryTab() {
  const [from, setFrom] = useState(() =>
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [outletId, setOutletId] = useState<string>('');
  const { data: outlets = [] } = useQuery({
    queryKey: ['pos-outlets'],
    queryFn: () => posService.getPosOutlets(),
  });
  const { data, isLoading } = useQuery({
    queryKey: ['pos-sales-summary', from, to, outletId || null],
    queryFn: () =>
      reportingService.getPosSalesSummary(
        from,
        to,
        outletId ? outletId : undefined
      ),
    enabled: from <= to,
  });
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LogoSpinner sizeClassName="h-10 w-10" logoSizeClassName="h-6 w-6" />
      </div>
    );
  }
  const report = data as PosSalesSummaryDto;
  const exportCsv = () => {
    const rows = report.byDay.map((row) => ({
      date: formatDate(row.date),
      ordersCount: row.ordersCount,
      salesTotal: row.salesTotal,
    }));
    downloadCsv(rows, `pos-sales-${from}-${to}.csv`, [
      { key: 'date', header: 'Date' },
      { key: 'ordersCount', header: 'Orders' },
      { key: 'salesTotal', header: 'Sales' },
    ]);
  };
  const chartData = report.byDay.map((row) => ({
    date: formatDate(row.date),
    sales: row.salesTotal,
  }));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            From
          </label>
          <input
            type="date"
            className="rounded border border-gray-300 px-3 py-1.5 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            To
          </label>
          <input
            type="date"
            className="rounded border border-gray-300 px-3 py-1.5 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Outlet
          </label>
          <select
            className="rounded border border-gray-300 px-3 py-1.5 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={outletId}
            onChange={(e) => setOutletId(e.target.value)}
          >
            <option value="">All outlets</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
          onClick={exportCsv}
        >
          Export CSV
        </button>
      </div>
      <div className="rounded border border-gray-200 p-4 dark:border-gray-600">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Orders: <strong>{report.ordersCount}</strong> · Sales total:{' '}
          <strong>{formatCurrency(report.salesTotal)}</strong> · Payments total:{' '}
          <strong>{formatCurrency(report.paymentsTotal)}</strong>
        </p>
      </div>
      {chartData.length > 0 && (
        <div className="h-64 w-full rounded border border-gray-200 dark:border-gray-600 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            >
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 1000 ? `${v / 1000}k` : String(v)
                }
              />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), 'Sales']}
                labelFormatter={(l) => `Date: ${l}`}
              />
              <Bar
                dataKey="sales"
                name="Sales"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {report.byOutlet.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            By outlet
          </h3>
          <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-600">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    Outlet
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                    Orders
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                    Sales
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {report.byOutlet.map((row) => (
                  <tr key={row.outletId}>
                    <td className="px-3 py-2">{row.outletName}</td>
                    <td className="px-3 py-2 text-right">{row.ordersCount}</td>
                    <td className="px-3 py-2 text-right">
                      {formatCurrency(row.salesTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        By day
      </h3>
      <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-600">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                Date
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                Orders
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                Sales
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {report.byDay.map((row) => (
              <tr key={row.date}>
                <td className="px-3 py-2">{formatDate(row.date)}</td>
                <td className="px-3 py-2 text-right">{row.ordersCount}</td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(row.salesTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ZReportEodTab() {
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [outletId, setOutletId] = useState<string>('');
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: outlets = [] } = useQuery({
    queryKey: ['pos-outlets'],
    queryFn: () => posService.getPosOutlets(),
  });
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['pos-zreport', date, outletId || null],
    queryFn: () =>
      reportingService.getPosZReport(
        date,
        outletId ? outletId : undefined
      ),
    enabled: false,
  });

  const handleGenerate = () => refetch();

  const handlePrint = () => {
    if (!reportRef.current) return;
    const prevTitle = document.title;
    document.title = `Z-Report ${date}`;
    const printContent = reportRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head><title>Z-Report ${date}</title></head>
          <body style="font-family: system-ui; padding: 16px;">
            ${printContent}
          </body>
        </html>
      `);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        win.close();
      }, 250);
    }
    document.title = prevTitle;
  };

  const showReport = data as PosZReportDto | undefined;
  const loading = isLoading || isFetching;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Report date
          </label>
          <input
            type="date"
            className="rounded border border-gray-300 px-3 py-1.5 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Outlet
          </label>
          <select
            className="rounded border border-gray-300 px-3 py-1.5 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={outletId}
            onChange={(e) => setOutletId(e.target.value)}
          >
            <option value="">All outlets</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Generating…' : 'Generate Z-Report / EOD'}
        </button>
        {showReport && (
          <button
            type="button"
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
            onClick={handlePrint}
          >
            Print
          </button>
        )}
      </div>
      {loading && (
        <div className="flex justify-center py-8">
          <LogoSpinner sizeClassName="h-8 w-8" logoSizeClassName="h-5 w-5" />
        </div>
      )}
      {showReport && !loading && (
        <div
          ref={reportRef}
          className="pos-z-report rounded border border-gray-200 bg-white p-6 dark:border-gray-600 dark:bg-gray-800"
        >
          <div className="text-center text-lg font-semibold text-gray-900 dark:text-white">
            {showReport.reportType}
          </div>
          <div className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
            {formatDate(showReport.reportDate)}
            {showReport.outletName && ` · ${showReport.outletName}`}
          </div>
          <div className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
            Generated {new Date(showReport.generatedAt).toLocaleString()}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded border border-gray-200 p-3 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Orders
              </p>
              <p className="text-lg font-semibold">{showReport.ordersCount}</p>
            </div>
            <div className="rounded border border-gray-200 p-3 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Gross sales
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(showReport.grossSales)}
              </p>
            </div>
            <div className="rounded border border-gray-200 p-3 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Discounts
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(showReport.discountsTotal)}
              </p>
            </div>
            <div className="rounded border border-gray-200 p-3 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Service charges
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(showReport.serviceChargesTotal)}
              </p>
            </div>
            <div className="rounded border border-gray-200 p-3 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Net sales
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(showReport.netSales)}
              </p>
            </div>
            <div className="rounded border border-gray-200 p-3 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Payments total
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(showReport.paymentsTotal)}
              </p>
            </div>
          </div>
          {showReport.paymentsByMethod.length > 0 && (
            <>
              <h4 className="mt-6 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Payments by method
              </h4>
              <table className="mt-2 min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                      Payment method
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {showReport.paymentsByMethod.map((row) => (
                    <tr key={row.paymentMethodId}>
                      <td className="px-3 py-2">{row.paymentMethodName}</td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
      {!showReport && !loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a date and optionally an outlet, then click Generate to view
          the Z-Report or End-of-Day summary.
        </p>
      )}
    </div>
  );
}
