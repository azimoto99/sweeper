import React, { Suspense, ComponentType, LazyExoticComponent } from 'react'
import { LoadingIndicator } from '../components/layout/LoadingIndicator'
import { ErrorBoundary } from '../components/layout/ErrorBoundary'

// Enhanced lazy loading with error boundary and custom loading
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode,
  errorFallback?: React.ReactNode
): React.ComponentType<React.ComponentProps<T>> {
  const LazyComponent = React.lazy(importFunc)

  const WrappedComponent = (props: React.ComponentProps<T>) => (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense 
        fallback={
          fallback || (
            <div className="flex items-center justify-center min-h-64">
              <LoadingIndicator size="lg" text="Loading..." />
            </div>
          )
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  )

  // Preserve component name for debugging
  WrappedComponent.displayName = `Lazy(Component)`

  return WrappedComponent
}

// Preload utility for better UX
export function preloadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): Promise<{ default: T }> {
  return importFunc()
}

// Route-based lazy loading with skeleton
export function createLazyRoute<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  skeletonType?: 'dashboard' | 'table' | 'form' | 'map'
) {
  const getSkeleton = () => {
    switch (skeletonType) {
      case 'dashboard':
        return (
          <div className="p-6 space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        )
      
      case 'table':
        return (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
              <div className="px-6 py-4 border-b">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="divide-y">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="px-6 py-4 flex space-x-4">
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      
      case 'form':
        return (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6 space-x-3">
                <div className="h-10 bg-gray-200 rounded w-20"></div>
                <div className="h-10 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        )
      
      case 'map':
        return (
          <div className="p-6">
            <div className="bg-gray-200 rounded-lg h-96 animate-pulse flex items-center justify-center">
              <div className="text-center">
                <div className="h-12 w-12 bg-gray-300 rounded-full mx-auto mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="flex items-center justify-center min-h-64">
            <LoadingIndicator size="lg" text="Loading..." />
          </div>
        )
    }
  }

  return createLazyComponent(importFunc, getSkeleton())
}

// Image lazy loading component
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  placeholder?: string
  className?: string
  onLoad?: () => void
  onError?: () => void
}

export function LazyImage({ 
  src, 
  alt, 
  placeholder, 
  className = '', 
  onLoad, 
  onError,
  ...props 
}: LazyImageProps) {
  const [loaded, setLoaded] = React.useState(false)
  const [error, setError] = React.useState(false)
  const [inView, setInView] = React.useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)

  // Intersection Observer for lazy loading
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setError(true)
    onError?.()
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <img src={placeholder} alt="" className="opacity-50" />
          ) : (
            <div className="text-gray-400">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Failed to load</span>
          </div>
        </div>
      )}

      {/* Actual image */}
      {inView && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
    </div>
  )
}

// Lazy loading hook for data
export function useLazyData<T>(
  fetchFn: () => Promise<T>,
  dependencies: React.DependencyList = []
) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await fetchFn()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, dependencies)

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// Bundle splitting utilities
export const LazyRoutes = {
  // Customer routes
  CustomerDashboard: createLazyRoute(
    () => import('../components/customer/CustomerDashboard').then(m => ({ default: m.CustomerDashboard })),
    'dashboard'
  ),
  BookingPage: createLazyRoute(
    () => import('../components/booking/BookingPage').then(m => ({ default: m.BookingPage })),
    'form'
  ),
  BookingHistory: createLazyRoute(
    () => import('../components/customer/BookingHistory').then(m => ({ default: m.BookingHistory })),
    'table'
  ),
  ServiceTracking: createLazyRoute(
    () => import('../components/customer/ServiceTracking').then(m => ({ default: m.ServiceTracking })),
    'map'
  ),

  // Worker routes
  WorkerDashboard: createLazyRoute(
    () => import('../components/worker/WorkerDashboard').then(m => ({ default: m.WorkerDashboard })),
    'dashboard'
  ),
  WorkerApp: createLazyRoute(
    () => import('../components/worker/WorkerApp').then(m => ({ default: m.WorkerApp })),
    'dashboard'
  ),

  // Admin routes
  AdminDashboard: createLazyRoute(
    () => import('../components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })),
    'dashboard'
  ),
  DispatchCenter: createLazyRoute(
    () => import('../components/admin/DispatchCenter').then(m => ({ default: m.DispatchCenter })),
    'map'
  ),
  WorkerManagement: createLazyRoute(
    () => import('../components/admin/WorkerManagement').then(m => ({ default: m.WorkerManagement })),
    'table'
  ),

  // Auth routes
  LoginForm: createLazyRoute(
    () => import('../components/auth/LoginForm').then(m => ({ default: m.LoginForm })),
    'form'
  ),
  SignupForm: createLazyRoute(
    () => import('../components/auth/SignupForm').then(m => ({ default: m.SignupForm })),
    'form'
  )
}
