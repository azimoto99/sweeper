import toast from 'react-hot-toast'

// Error types for better categorization
export enum ErrorType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  VALIDATION = 'validation',
  DATABASE = 'database',
  PAYMENT = 'payment',
  LOCATION = 'location',
  UNKNOWN = 'unknown'
}

export interface AppError {
  type: ErrorType
  message: string
  code?: string
  details?: any
  timestamp: Date
  userId?: string
  action?: string
}

// Enhanced error handling utility
export class ErrorHandler {
  private static instance: ErrorHandler
  private errors: AppError[] = []

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  // Handle different types of errors
  handle(error: any, context?: { userId?: string; action?: string }) {
    const appError = this.parseError(error, context)
    this.logError(appError)
    this.showUserFeedback(appError)
    return appError
  }

  private parseError(error: any, context?: { userId?: string; action?: string }): AppError {
    let errorType = ErrorType.UNKNOWN
    let message = 'An unexpected error occurred'
    let code = ''

    // Supabase errors
    if (error?.code) {
      switch (error.code) {
        case '23505':
          errorType = ErrorType.DATABASE
          message = 'This record already exists'
          break
        case '23503':
          errorType = ErrorType.DATABASE
          message = 'Referenced record not found'
          break
        case 'PGRST301':
          errorType = ErrorType.AUTHORIZATION
          message = 'You do not have permission to perform this action'
          break
        case 'PGRST116':
          errorType = ErrorType.DATABASE
          message = 'Record not found'
          break
        default:
          errorType = ErrorType.DATABASE
          message = error.message || 'Database error occurred'
      }
      code = error.code
    }
    // Auth errors
    else if (error?.message?.includes('Invalid login credentials')) {
      errorType = ErrorType.AUTHENTICATION
      message = 'Invalid email or password'
    }
    else if (error?.message?.includes('Email not confirmed')) {
      errorType = ErrorType.AUTHENTICATION
      message = 'Please verify your email address before signing in'
    }
    else if (error?.message?.includes('User already registered')) {
      errorType = ErrorType.AUTHENTICATION
      message = 'An account with this email already exists'
    }
    // Network errors
    else if (error?.message?.includes('Failed to fetch') || error?.name === 'NetworkError') {
      errorType = ErrorType.NETWORK
      message = 'Network connection error. Please check your internet connection and try again.'
    }
    // Payment errors
    else if (error?.message?.includes('PayPal') || error?.message?.includes('payment')) {
      errorType = ErrorType.PAYMENT
      message = 'Payment processing failed. Please try again or use a different payment method.'
    }
    // Location errors
    else if (error?.message?.includes('location') || error?.message?.includes('GPS')) {
      errorType = ErrorType.LOCATION
      message = 'Location access denied. Please enable location services and try again.'
    }
    // Validation errors
    else if (error?.message?.includes('required') || error?.message?.includes('invalid')) {
      errorType = ErrorType.VALIDATION
      message = error.message || 'Please check your input and try again'
    }
    // Generic error with message
    else if (error?.message) {
      message = error.message
    }

    return {
      type: errorType,
      message,
      code,
      details: error,
      timestamp: new Date(),
      userId: context?.userId,
      action: context?.action
    }
  }

  private logError(error: AppError) {
    // Store error for debugging
    this.errors.push(error)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error Handler]', {
        type: error.type,
        message: error.message,
        code: error.code,
        timestamp: error.timestamp,
        userId: error.userId,
        action: error.action,
        details: error.details
      })
    }

    // In production, you might want to send to a logging service
    // Example: sendToLoggingService(error)
  }

  private showUserFeedback(error: AppError) {
    const toastOptions = {
      duration: 6000,
      position: 'top-right' as const,
    }

    switch (error.type) {
      case ErrorType.AUTHENTICATION:
        toast.error(error.message, { ...toastOptions, icon: '🔐' })
        break
      case ErrorType.AUTHORIZATION:
        toast.error(error.message, { ...toastOptions, icon: '🚫' })
        break
      case ErrorType.NETWORK:
        toast.error(error.message, { ...toastOptions, icon: '🌐' })
        break
      case ErrorType.VALIDATION:
        toast.error(error.message, { ...toastOptions, icon: '⚠️' })
        break
      case ErrorType.DATABASE:
        toast.error(error.message, { ...toastOptions, icon: '💾' })
        break
      case ErrorType.PAYMENT:
        toast.error(error.message, { ...toastOptions, icon: '💳' })
        break
      case ErrorType.LOCATION:
        toast.error(error.message, { ...toastOptions, icon: '📍' })
        break
      default:
        toast.error(error.message, toastOptions)
    }
  }

  // Get recent errors for debugging
  getRecentErrors(limit: number = 10): AppError[] {
    return this.errors.slice(-limit)
  }

  // Clear error history
  clearErrors() {
    this.errors = []
  }
}

// Convenience function for handling errors
export const handleError = (error: any, context?: { userId?: string; action?: string }) => {
  return ErrorHandler.getInstance().handle(error, context)
}

// Success feedback utility
export const showSuccess = (message: string, options?: { duration?: number; action?: string }) => {
  toast.success(message, {
    duration: options?.duration || 4000,
    position: 'top-right',
    icon: '✅'
  })
}

// Info feedback utility
export const showInfo = (message: string, options?: { duration?: number; action?: string }) => {
  toast(message, {
    duration: options?.duration || 4000,
    position: 'top-right',
    icon: 'ℹ️'
  })
}

// Warning feedback utility
export const showWarning = (message: string, options?: { duration?: number; action?: string }) => {
  toast(message, {
    duration: options?.duration || 5000,
    position: 'top-right',
    icon: '⚠️'
  })
}

// Loading state management
export class LoadingManager {
  private static instance: LoadingManager
  private loadingStates: Map<string, boolean> = new Map()

  static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager()
    }
    return LoadingManager.instance
  }

  setLoading(key: string, loading: boolean, message?: string) {
    this.loadingStates.set(key, loading)
    
    if (loading && message) {
      toast.loading(message, { id: key })
    } else if (!loading) {
      toast.dismiss(key)
    }
  }

  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false
  }

  clearAll() {
    this.loadingStates.clear()
    toast.dismiss()
  }
}

// Convenience functions for loading states
export const setLoading = (key: string, loading: boolean, message?: string) => {
  LoadingManager.getInstance().setLoading(key, loading, message)
}

export const isLoading = (key: string): boolean => {
  return LoadingManager.getInstance().isLoading(key)
}

// Retry utility for failed operations
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (i === maxRetries - 1) {
        throw error
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }

  throw lastError
}