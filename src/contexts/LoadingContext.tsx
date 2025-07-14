import React, { createContext, useContext, ReactNode, useState } from 'react'

interface LoadingContextType {
  isLoading: boolean
  setLoading: (loading: boolean) => void
  loadingMessage?: string
  setLoadingMessage: (message?: string) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>()

  const setLoading = (loading: boolean) => {
    setIsLoading(loading)
    if (!loading) {
      setLoadingMessage(undefined)
    }
  }

  return (
    <LoadingContext.Provider value={{
      isLoading,
      setLoading,
      loadingMessage,
      setLoadingMessage
    }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoadingContext() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoadingContext must be used within a LoadingProvider')
  }
  return context
}

export { LoadingContext }
