import { toast } from 'sonner';

const toastOptions = { duration: Infinity, dismissible: true };

export const showSuccess = (title: string, description?: string) =>
  toast.success(title, { description, ...toastOptions });

export const showError = (title: string, description?: string) =>
  toast.error(title, { description, ...toastOptions });

export const showInfo = (title: string, description?: string) =>
  toast(title, { description, ...toastOptions });

export const showWarning = (title: string, description?: string) =>
  toast.warning(title, { description, ...toastOptions });
