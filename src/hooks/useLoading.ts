import { useLoadingContext } from '../contexts/LoadingContext'

export function useLoading() {
  const { isLoading, setLoading, loadingMessage, setLoadingMessage } = useLoadingContext()

  const startLoading = (message?: string) => {
    if (message) {
      setLoadingMessage(message)
    }
    setLoading(true)
  }

  const stopLoading = () => {
    setLoading(false)
  }

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading
  }
}
