import React from 'react'
import toast from 'react-hot-toast'

export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
  userId?: string
  context?: string
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private errorLog: AppError[] = []

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  logError(error: AppError): void {
    this.errorLog.push(error)
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('App Error:', error)
    }

    // Send to monitoring service in production
    if (import.meta.env.PROD) {
      this.sendToMonitoring(error)
    }
  }

  handleError(error: any, context?: string, userId?: string): void {
    const appError: AppError = {
      code: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      details: error,
      timestamp: new Date(),
      userId,
      context
    }

    this.logError(appError)
    this.showUserNotification(appError)
  }

  private getErrorCode(error: any): string {
    if (error?.code) return error.code
    if (error?.name) return error.name
    if (error?.status) return `HTTP_${error.status}`
    return 'UNKNOWN_ERROR'
  }

  private getErrorMessage(error: any): string {
    // Supabase errors
    if (error?.message) {
      // Handle common Supabase error messages
      if (error.message.includes('JWT expired')) {
        return 'Your session has expired. Please sign in again.'
      }
      if (error.message.includes('Row Level Security')) {
        return 'You do not have permission to perform this action.'
      }
      if (error.message.includes('duplicate key')) {
        return 'This record already exists.'
      }
      if (error.message.includes('foreign key')) {
        return 'Cannot complete this action due to related data.'
      }
      return error.message
    }

    // Network errors
    if (error?.name === 'NetworkError') {
      return 'Network connection error. Please check your internet connection.'
    }

    // Validation errors
    if (error?.name === 'ValidationError') {
      return 'Please check your input and try again.'
    }

    // Payment errors
    if (error?.name === 'PaymentError') {
      return 'Payment processing failed. Please try again or use a different payment method.'
    }

    // Location errors
    if (error?.name === 'GeolocationError') {
      return 'Unable to access your location. Please enable location services.'
    }

    return 'An unexpected error occurred. Please try again.'
  }

  private showUserNotification(error: AppError): void {
    const isUserFriendly = this.isUserFriendlyError(error.code)
    
    if (isUserFriendly) {
      toast.error(error.message)
    } else {
      toast.error('Something went wrong. Our team has been notified.')
    }
  }

  private isUserFriendlyError(code: string): boolean {
    const userFriendlyCodes = [
      'VALIDATION_ERROR',
      'PERMISSION_DENIED',
      'NETWORK_ERROR',
      'PAYMENT_ERROR',
      'GEOLOCATION_ERROR',
      'SESSION_EXPIRED'
    ]
    return userFriendlyCodes.includes(code)
  }

  private async sendToMonitoring(error: AppError): Promise<void> {
    try {
      // In a real app, you'd send to a service like Sentry, LogRocket, etc.
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      })
    } catch (monitoringError) {
      console.error('Failed to send error to monitoring:', monitoringError)
    }
  }

  getErrorLog(): AppError[] {
    return [...this.errorLog]
  }

  clearErrorLog(): void {
    this.errorLog = []
  }
}

// Validation utilities
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  phone: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    return phoneRegex.test(phone)
  },

  password: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  required: (value: any, fieldName: string): void => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw new ValidationError(`${fieldName} is required`)
    }
  },

  minLength: (value: string, min: number, fieldName: string): void => {
    if (value.length < min) {
      throw new ValidationError(`${fieldName} must be at least ${min} characters long`)
    }
  },

  maxLength: (value: string, max: number, fieldName: string): void => {
    if (value.length > max) {
      throw new ValidationError(`${fieldName} must be no more than ${max} characters long`)
    }
  },

  numeric: (value: string, fieldName: string): void => {
    if (!/^\d+$/.test(value)) {
      throw new ValidationError(`${fieldName} must contain only numbers`)
    }
  },

  currency: (value: number, fieldName: string): void => {
    if (value < 0) {
      throw new ValidationError(`${fieldName} cannot be negative`)
    }
    if (value > 10000) {
      throw new ValidationError(`${fieldName} cannot exceed $10,000`)
    }
  },

  coordinates: (lat: number, lng: number): void => {
    if (lat < -90 || lat > 90) {
      throw new ValidationError('Invalid latitude coordinate')
    }
    if (lng < -180 || lng > 180) {
      throw new ValidationError('Invalid longitude coordinate')
    }
  },

  serviceArea: (lat: number, lng: number): void => {
    // Laredo, TX service area validation
    const centerLat = 27.5306
    const centerLng = -99.4803
    const maxDistance = 25 // miles

    const distance = calculateDistance(centerLat, centerLng, lat, lng)
    if (distance > maxDistance) {
      throw new ValidationError(`Service area is limited to ${maxDistance} miles from Laredo, TX`)
    }
  }
}

// Utility function to calculate distance between coordinates
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// React hook for error handling
export function useErrorHandler() {
  const errorHandler = ErrorHandler.getInstance()

  return {
    handleError: (error: any, context?: string) => {
      errorHandler.handleError(error, context)
    },
    logError: (error: AppError) => {
      errorHandler.logError(error)
    }
  }
}

// Higher-order component for error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; resetError: () => void }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorHandler = ErrorHandler.getInstance()
    errorHandler.handleError(error, 'React Error Boundary')
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                We're sorry, but something unexpected happened. Our team has been notified and is working to fix the issue.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={this.resetError}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorHandler