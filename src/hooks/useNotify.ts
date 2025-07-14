import toast from 'react-hot-toast'

export function useNotify() {
  const success = (message: string) => {
    toast.success(message)
  }

  const error = (message: string) => {
    toast.error(message)
  }

  const info = (message: string) => {
    toast(message, {
      icon: 'ℹ️',
    })
  }

  const warning = (message: string) => {
    toast(message, {
      icon: '⚠️',
    })
  }

  const loading = (message: string) => {
    return toast.loading(message)
  }

  const dismiss = (toastId?: string) => {
    toast.dismiss(toastId)
  }

  return {
    success,
    error,
    info,
    warning,
    loading,
    dismiss
  }
}
