import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignalR } from '@contexts/SignalRContext';
import { NotificationHelper } from '@/utils/notification.helper';
import Swal from 'sweetalert2';

export const NotificationToast = () => {
  const { notifications } = useSignalR();
  const lastShownIdRef = useRef<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (notifications.length === 0) return;

    const latest = notifications[0];
    const id = latest?.id ?? latest?.notification?.id;
    if (!id || id === lastShownIdRef.current) return;

    lastShownIdRef.current = id;
    const formatted = NotificationHelper.format(latest, false);

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      // title: 'New Notification',
      text: formatted.text,
      showConfirmButton: false,
      timer: 5000,
      timerProgressBar: true,
      iconHtml: `<svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5-5V7a3 3 0 00-6 0v5l-5 5h5m0 0v1a3 3 0 006 0v-1m-6 0h6"></path>
      </svg>`,
      customClass: {
        popup: 'colored-toast',
      },
      didOpen: (toast) => {
        toast.addEventListener('click', () => {
          if (formatted.url) {
            // Check if it's an external URL (like file downloads)
            if (formatted.url.startsWith('http://') || formatted.url.startsWith('https://')) {
              window.location.href = formatted.url;
            } else {
              // Use React Router for internal navigation (no page reload)
              navigate(formatted.url);
            }
          }
          Swal.close();
        });
      },
    });
  }, [notifications]);

  return null;
};
