import { Navigate, useLocation, useNavigate } from 'react-router-dom';

type CheckInConfirmationState = {
  stayId: string;
  stayNo: string;
  folioId: string;
  folioNo: string;
};

export const CheckInConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as CheckInConfirmationState | null;

  if (!state?.stayId || !state?.stayNo || !state?.folioId || !state?.folioNo) {
    return <Navigate to="/front-desk/check-in" replace />;
  }

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-lg border border-emerald-200 bg-white p-6 shadow dark:border-emerald-700/40 dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">Check-In Completed</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Guest check-in has been completed successfully.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div className="rounded border p-3 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">Stay No</p>
              <p className="font-semibold text-gray-900 dark:text-white">{state.stayNo}</p>
            </div>
            <div className="rounded border p-3 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">Folio No</p>
              <p className="font-semibold text-gray-900 dark:text-white">{state.folioNo}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
              onClick={() => navigate('/front-desk/stays', { replace: true })}
            >
              Open In-House Stays
            </button>
            <button
              type="button"
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200"
              onClick={() => navigate('/front-desk/check-in', { replace: true })}
            >
              Back to Check-In List
            </button>
          </div>
        </section>
      </div>
    </>
  );
};
