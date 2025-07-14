import toast from 'react-hot-toast';

export const useNotify = () => {
  const success = (message: string) => {
    toast.success(message);
  };

  const error = (message: string) => {
    toast.error(message);
  };

  const loading = (message: string) => {
    return toast.loading(message);
  };

  const dismiss = (toastId: string) => {
    toast.dismiss(toastId);
  };

  const custom = (component: any) => {
    toast.custom(component);
  };

  return { success, error, loading, dismiss, custom };
};
