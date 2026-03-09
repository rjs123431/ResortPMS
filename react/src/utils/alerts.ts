import Swal, { SweetAlertIcon, SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

type NotifyVariant = SweetAlertIcon;

type NotifyOptions = Omit<SweetAlertOptions, 'toast' | 'position' | 'showConfirmButton' | 'timer' | 'icon'>;

type ConfirmOptions = Omit<
  SweetAlertOptions,
  'icon' | 'showCancelButton' | 'confirmButtonText' | 'cancelButtonText'
> & {
  confirmButtonText?: string;
  cancelButtonText?: string;
  title?: string;
};

const toast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

const notify = (variant: NotifyVariant, message: string, title?: string, options?: NotifyOptions) => {
  const payload = {
    icon: variant,
    title: title || undefined,
    text: message,
    ...options,
  } as SweetAlertOptions;

  return toast.fire(payload);
};

export const notifySuccess = (message: string, title?: string, options?: NotifyOptions) =>
  notify('success', message, title, options);

export const notifyInfo = (message: string, title?: string, options?: NotifyOptions) =>
  notify('info', message, title, options);

export const notifyWarning = (message: string, title?: string, options?: NotifyOptions) =>
  notify('warning', message, title, options);

export const notifyError = (message: string, title?: string, options?: NotifyOptions) =>
  notify('error', message, title, options);

export const confirmAction = async (
  message: string,
  options: ConfirmOptions = {}
): Promise<SweetAlertResult> => {
  const {
    title = 'Are you sure?',
    confirmButtonText = 'Yes',
    cancelButtonText = 'Cancel',
    ...rest
  } = options;

  const payload = {
    title,
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    ...rest,
  } as SweetAlertOptions;

  return Swal.fire(payload);
};

export const showMessageDialog = async (
  message: string,
  title = 'Message',
  icon: SweetAlertIcon = 'info',
  options: Omit<SweetAlertOptions, 'icon' | 'title' | 'text'> = {}
) => {
  const payload = {
    icon,
    title,
    text: message,
    confirmButtonText: 'OK',
    ...options,
  } as SweetAlertOptions;

  return Swal.fire(payload);
};

export const showErrorDialog = async (
  message: string,
  title = 'Error',
  options: Omit<SweetAlertOptions, 'icon' | 'title' | 'text'> = {}
) => {
  return showMessageDialog(message, title, 'error', options);
};
