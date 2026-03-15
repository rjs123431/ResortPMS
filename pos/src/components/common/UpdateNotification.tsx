import React, { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const updateSWRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    updateSWRef.current = registerSW({
      immediate: true,
      onNeedRefresh: () => setUpdateAvailable(true),
    });
  }, []);

  const handleRefresh = () => {
    updateSWRef.current?.();
    setDismissed(true);
  };

  const showBanner = (updateAvailable) && !dismissed;

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] flex items-center justify-between gap-4 bg-slate-800 text-white px-4 py-3 shadow-lg border-t border-slate-700"
      role="alert"
      aria-live="polite"
    >
      <p className="text-sm font-medium">
        {updateAvailable
          ? 'A new version of the app is available.'
          : 'App is ready.'}
      </p>
      <div className="flex items-center gap-2 shrink-0">
        {updateAvailable && (
          <button
            type="button"
            onClick={handleRefresh}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-md text-sm font-medium transition-colors"
          >
            Refresh
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="px-4 py-2 text-slate-300 hover:text-white text-sm font-medium transition-colors"
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default UpdateNotification;
