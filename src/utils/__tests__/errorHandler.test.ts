import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ErrorHandler, handleError, showSuccess, setLoading, isLoading } from '../errorHandler'

// Mock dependencies
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}))

vi.mock('@heroicons/react/24/outline', () => ({
  CheckCircleIcon: 'CheckCircleIcon',
  ExclamationTriangleIcon: 'ExclamationTriangleIcon',
  XCircleIcon: 'XCircleIcon',
  ShieldExclamationIcon: 'ShieldExclamationIcon',
  CreditCardIcon: 'CreditCardIcon',
  MapPinIcon: 'MapPinIcon',
  WifiIcon: 'WifiIcon',
  ServerIcon: 'ServerIcon',
  UserIcon: 'UserIcon',
}))

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance()
    vi.clearAllMocks()
  })

  describe('getInstance', () => {
    it('returns singleton instance', () => {
      const instance1 = ErrorHandler.getInstance()
      const instance2 = ErrorHandler.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('categorizeError', () => {
    it('categorizes authentication errors', () => {
      const authError = new Error('Invalid credentials')
      authError.message = 'Invalid credentials'
      
      const category = errorHandler.categorizeError(authError)
      expect(category).toBe('authentication')
    })

    it('categorizes network errors', () => {
      const networkError = new Error('Network error')
      networkError.message = 'fetch failed'
      
      const category = errorHandler.categorizeError(networkError)
      expect(category).toBe('network')
    })

    it('categorizes validation errors', () => {
      const validationError = new Error('Required field')
      validationError.message = 'email is required'
      
      const category = errorHandler.categorizeError(validationError)
      expect(category).toBe('validation')
    })

    it('categorizes database errors', () => {
      const dbError = { code: 'PGRST116', message: 'Database error' }
      
      const category = errorHandler.categorizeError(dbError)
      expect(category).toBe('database')
    })

    it('categorizes payment errors', () => {
      const paymentError = new Error('Payment failed')
      paymentError.message = 'payment_failed'
      
      const category = errorHandler.categorizeError(paymentError)
      expect(category).toBe('payment')
    })

    it('categorizes location errors', () => {
      const locationError = new Error('Location error')
      locationError.message = 'geolocation unavailable'
      
      const category = errorHandler.categorizeError(locationError)
      expect(category).toBe('location')
    })

    it('defaults to general for unknown errors', () => {
      const unknownError = new Error('Unknown error')
      
      const category = errorHandler.categorizeError(unknownError)
      expect(category).toBe('general')
    })
  })

  describe('handle', () => {
    it('handles errors with context', () => {
      const error = new Error('Test error')
      const context = { userId: 'test-user', action: 'test-action' }
      
      const result = errorHandler.handle(error, context)
      
      expect(result).toEqual({
        success: false,
        error: 'Test error',
        category: 'general',
        context
      })
    })

    it('handles string errors', () => {
      const result = errorHandler.handle('String error')
      
      expect(result).toEqual({
        success: false,
        error: 'String error',
        category: 'general',
        context: undefined
      })
    })

    it('handles null/undefined errors', () => {
      const result = errorHandler.handle(null)
      
      expect(result).toEqual({
        success: false,
        error: 'An unknown error occurred',
        category: 'general',
        context: undefined
      })
    })
  })
})

describe('Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleError', () => {
    it('calls ErrorHandler.handle', () => {
      const error = new Error('Test error')
      const context = { userId: 'test-user' }
      
      const result = handleError(error, context)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Test error')
      expect(result.context).toBe(context)
    })
  })

  describe('showSuccess', () => {
    it('shows success toast', () => {
      const toast = vi.mocked(require('react-hot-toast').default)
      
      showSuccess('Success message')
      
      expect(toast.success).toHaveBeenCalledWith('Success message', {
        icon: 'CheckCircleIcon',
        duration: 4000,
        position: 'top-right',
        style: expect.any(Object)
      })
    })
  })

  describe('setLoading', () => {
    it('sets loading state', () => {
      setLoading('test-key', true, 'Loading...')
      expect(isLoading('test-key')).toBe(true)
    })

    it('clears loading state', () => {
      setLoading('test-key', true, 'Loading...')
      setLoading('test-key', false)
      expect(isLoading('test-key')).toBe(false)
    })
  })

  describe('isLoading', () => {
    it('returns false for non-existent keys', () => {
      expect(isLoading('non-existent')).toBe(false)
    })

    it('returns true for active loading states', () => {
      setLoading('test-key', true, 'Loading...')
      expect(isLoading('test-key')).toBe(true)
    })
  })
})