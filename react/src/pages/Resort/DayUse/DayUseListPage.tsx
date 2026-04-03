import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { resortService } from '@services/resort.service';
import { formatDate, formatMoney } from '@utils/helpers';
import { DayUseVisitDetailDialog } from './DayUseVisitDetailDialog';
import { DayUseGuestContext } from '@/types/day-use.types';
import { dayUseContextLabel, dayUseStatusBadgeClass, dayUseStatusLabel } from './dayUseUi';

const formatDateOnly = (value: Date) => {
  const pad = (input: number) => input.toString().padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

export const DayUseListPage = () => {
  const [filter, setFilter] = useState('');
  const [visitDate, setVisitDate] = useState(() => formatDateOnly(new Date()));
  const [guestContext, setGuestContext] = useState<DayUseGuestContext | 'all'>('all');
  const [selectedVisitId, setSelectedVisitId] = useState('');

  const { data: visitsData, isLoading } = useQuery({
    queryKey: ['day-use-list-page', filter, visitDate, guestContext],
    queryFn: () => resortService.getDayUseVisitsPaged({
      filter,
      visitDate,
      guestContext: guestContext === 'all' ? undefined : guestContext,
      maxResultCount: 100,
    }),
  });

  const { data: selectedVisit, isLoading: selectedVisitLoading } = useQuery({
    queryKey: ['day-use-list-detail', selectedVisitId],
    queryFn: () => resortService.getDayUseVisit(selectedVisitId),
    enabled: Boolean(selectedVisitId),
  });

  const visits = useMemo(() => visitsData?.items ?? [], [visitsData?.items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Day-Use Visits</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Review saved day-use visits and inspect charges and payments.</p>
        </div>
        <Link to="/front-desk/day-use/new" className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700">
          New Sale
        </Link>
      </div>

      <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Visits</label>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" placeholder="Search visit no or guest" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Visit Date</label>
            <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Guest Context</label>
            <select value={guestContext} onChange={(e) => setGuestContext(e.target.value === 'all' ? 'all' : Number(e.target.value) as DayUseGuestContext)} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
              <option value="all">All</option>
              <option value={DayUseGuestContext.WalkIn}>Walk-In</option>
              <option value={DayUseGuestContext.InHouse}>In-House</option>
            </select>
          </div>
        </div>

        {isLoading ? <p className="text-sm text-gray-500 dark:text-gray-400">Loading visits...</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Visit No.</th>
                <th className="p-2">Guest</th>
                <th className="p-2">Context</th>
                <th className="p-2">Status</th>
                <th className="p-2">Total</th>
                <th className="p-2">Paid</th>
                <th className="p-2">Balance</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr className="border-b" key={visit.id}>
                  <td className="p-2">{visit.visitNo}</td>
                  <td className="p-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{visit.guestName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(visit.visitDate)}</p>
                    </div>
                  </td>
                  <td className="p-2">{dayUseContextLabel(visit.guestContext)}</td>
                  <td className="p-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${dayUseStatusBadgeClass(visit.status)}`}>
                      {dayUseStatusLabel(visit.status)}
                    </span>
                  </td>
                  <td className="p-2">{formatMoney(visit.totalAmount)}</td>
                  <td className="p-2">{formatMoney(visit.paidAmount)}</td>
                  <td className="p-2">{formatMoney(visit.balanceAmount)}</td>
                  <td className="p-2">
                    <button type="button" className="rounded bg-slate-700 px-3 py-1 text-white" onClick={() => setSelectedVisitId(visit.id)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {visits.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500 dark:text-gray-400" colSpan={8}>No day-use visits found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <DayUseVisitDetailDialog
        open={Boolean(selectedVisitId)}
        visit={selectedVisit ?? null}
        isLoading={selectedVisitLoading}
        onClose={() => setSelectedVisitId('')}
      />
    </div>
  );
};