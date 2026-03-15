import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import {
  auditService,
  type MutationAuditLogDto,
  type FinancialAuditLogDto,
  type GetMutationAuditLogInput,
  type GetFinancialAuditLogInput,
} from '@services/audit.service';
import { LogoSpinner } from '@components/common/LogoSpinner';

const PAGE_SIZE = 25;
const entityTypes = ['Reservation', 'Stay', 'Folio'];
const eventTypes = [
  'TransactionCreated',
  'TransactionVoided',
  'PaymentCreated',
  'PaymentVoided',
  'AdjustmentCreated',
];

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'medium',
    });
  }
  return iso;
}

function MutationLogTab() {
  const [page, setPage] = useState(0);
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const input: GetMutationAuditLogInput = {
    skipCount: page * PAGE_SIZE,
    maxResultCount: PAGE_SIZE,
    entityType: entityType || undefined,
    entityId: entityId.trim() || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['audit-mutation', input],
    queryFn: () => auditService.getMutationAuditPaged(input),
  });

  const items = data?.items ?? [];
  const total = data?.totalCount ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Entity type</label>
          <select
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All</option>
            {entityTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Entity ID</label>
          <input
            type="text"
            className="w-48 rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="e.g. guid"
            value={entityId}
            onChange={(e) => {
              setEntityId(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">From date</label>
          <input
            type="date"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">To date</label>
          <input
            type="date"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LogoSpinner sizeClassName="h-8 w-8" logoSizeClassName="h-5 w-5" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-600">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Time</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Entity</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">ID</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Action</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Method</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Extra</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                      No mutation audit records found.
                    </td>
                  </tr>
                ) : (
                  items.map((row: MutationAuditLogDto) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="whitespace-nowrap px-3 py-2 text-gray-600 dark:text-gray-300">
                        {formatDate(row.executionTime)}
                      </td>
                      <td className="px-3 py-2">{row.entityType}</td>
                      <td className="max-w-[120px] truncate px-3 py-2 font-mono text-xs" title={row.entityId}>
                        {row.entityId}
                      </td>
                      <td className="px-3 py-2">{row.action}</td>
                      <td className="max-w-[140px] truncate px-3 py-2 text-xs" title={row.methodName}>
                        {row.methodName || '—'}
                      </td>
                      <td className="max-w-[100px] truncate px-3 py-2 text-xs" title={row.extra}>
                        {row.extra || '—'}
                      </td>
                      <td className="px-3 py-2">
                        {(row.oldValueJson || row.newValueJson) && (
                          <details className="cursor-pointer">
                            <summary className="text-primary-600 dark:text-primary-400">View JSON</summary>
                            <pre className="mt-1 max-h-32 overflow-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
                              {row.oldValueJson && (
                                <>
                                  <span className="text-gray-500">Old: </span>
                                  {row.oldValueJson}
                                </>
                              )}
                              {row.oldValueJson && row.newValueJson && '\n'}
                              {row.newValueJson && (
                                <>
                                  <span className="text-gray-500">New: </span>
                                  {row.newValueJson}
                                </>
                              )}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-600">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {total} record(s)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </button>
                <span className="flex items-center px-2 text-sm text-gray-600 dark:text-gray-300">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FinancialLogTab() {
  const [page, setPage] = useState(0);
  const [eventType, setEventType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const input: GetFinancialAuditLogInput = {
    skipCount: page * PAGE_SIZE,
    maxResultCount: PAGE_SIZE,
    eventType: eventType || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['audit-financial', input],
    queryFn: () => auditService.getFinancialAuditPaged(input),
  });

  const items = data?.items ?? [];
  const total = data?.totalCount ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Event type</label>
          <select
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={eventType}
            onChange={(e) => {
              setEventType(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">From date</label>
          <input
            type="date"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">To date</label>
          <input
            type="date"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LogoSpinner sizeClassName="h-8 w-8" logoSizeClassName="h-5 w-5" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-600">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Time</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Event</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Reference</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Description</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Folio / Stay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                      No financial audit records found.
                    </td>
                  </tr>
                ) : (
                  items.map((row: FinancialAuditLogDto) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="whitespace-nowrap px-3 py-2 text-gray-600 dark:text-gray-300">
                        {formatDate(row.executionTime)}
                      </td>
                      <td className="px-3 py-2">{row.eventType}</td>
                      <td className="max-w-[120px] truncate px-3 py-2 font-mono text-xs" title={row.referenceId}>
                        {row.referenceType}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2" title={row.description}>
                        {row.description || '—'}
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-2 font-mono text-xs">
                        {row.folioId}
                        {row.stayId && ` / ${row.stayId}`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-600">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {total} record(s)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </button>
                <span className="flex items-center px-2 text-sm text-gray-600 dark:text-gray-300">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export const AuditTrailPage = () => {
  const [activeTab, setActiveTab] = useState<'mutation' | 'financial'>('mutation');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Trail</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View mutation and financial audit logs for compliance and troubleshooting.
            </p>
          </div>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-600">
            <nav className="-mb-px flex gap-4">
              <button
                type="button"
                className={`border-b-2 px-1 py-3 text-sm font-medium ${
                  activeTab === 'mutation'
                    ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('mutation')}
              >
                Mutation log
              </button>
              <button
                type="button"
                className={`border-b-2 px-1 py-3 text-sm font-medium ${
                  activeTab === 'financial'
                    ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('financial')}
              >
                Financial log
              </button>
            </nav>
          </div>
          <div className="pt-4">
            {activeTab === 'mutation' && <MutationLogTab />}
            {activeTab === 'financial' && <FinancialLogTab />}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};
