import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { resortService } from '@services/resort.service';

export const StaysPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');

  const { data: staysData, refetch } = useQuery({
    queryKey: ['resort-stays', filter],
    queryFn: () => resortService.getInHouseStays(filter, 0, 100),
  });

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">In-House Stays</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Monitor active stays and post folio transactions.</p>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search In-House Stays</label>
              <input
                className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="Search by stay no, guest name, or room number"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className="rounded bg-slate-700 px-4 py-2 text-white"
                onClick={() => void refetch()}
              >
                Refresh
              </button>
            </div>
          </div>

          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Active Stays</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Stay No</th>
                  <th className="p-2">Guest</th>
                  <th className="p-2">Room</th>
                  <th className="p-2">Check-In</th>
                  <th className="p-2">Expected Check-Out</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {(staysData?.items ?? []).map((stay) => (
                  <tr className="border-b" key={stay.id}>
                    <td className="p-2">{stay.stayNo}</td>
                    <td className="p-2">{stay.guestName}</td>
                    <td className="p-2">{stay.roomNumber}</td>
                    <td className="p-2">{stay.checkInDateTime ? new Date(stay.checkInDateTime).toLocaleString() : '–'}</td>
                    <td className="p-2">{new Date(stay.expectedCheckOutDateTime).toLocaleDateString()}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="rounded bg-indigo-700 px-3 py-1 text-white"
                        onClick={() => navigate(`/front-desk/stays/${stay.id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {(staysData?.items ?? []).length === 0 ? (
                  <tr>
                    <td className="p-3 text-gray-500" colSpan={6}>No in-house stays found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
};
