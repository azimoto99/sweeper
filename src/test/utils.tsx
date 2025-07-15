import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import { vi } from 'vitest'

// Mock Supabase client
export const createMockSupabaseClient = () => ({
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybe: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    then: vi.fn(),
  })),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
    })),
  },
})

// Mock profile data
export const createMockProfile = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  phone: '+1234567890',
  role: 'customer' as const,
  address: '123 Test St, Test City, TX 12345',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

// Mock worker data
export const createMockWorker = (overrides = {}) => ({
  id: 'test-worker-id',
  profile_id: 'test-profile-id',
  status: 'available' as const,
  current_location: null,
  vehicle_info: 'Honda Civic',
  emergency_contact: 'Emergency Contact',
  emergency_phone: '+1234567890',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

// Mock booking data
export const createMockBooking = (overrides = {}) => ({
  id: 'test-booking-id',
  user_id: 'test-user-id',
  worker_id: 'test-worker-id',
  service_type: 'regular' as const,
  address: '123 Test St, Test City, TX 12345',
  scheduled_date: new Date().toISOString().split('T')[0],
  scheduled_time: '10:00',
  price: 100,
  status: 'pending' as const,
  notes: 'Test booking notes',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

// Mock subscription data
export const createMockSubscription = (overrides = {}) => ({
  id: 'test-subscription-id',
  user_id: 'test-user-id',
  tier: 'silver' as const,
  status: 'active' as const,
  paypal_subscription_id: 'test-paypal-id',
  next_billing_date: new Date().toISOString(),
  discount_percentage: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

// Mock auth context
export const createMockAuthContext = (overrides = {}) => ({
  user: null,
  profile: createMockProfile(),
  loading: false,
  updateProfile: vi.fn(),
  signOut: vi.fn(),
  ...overrides,
})

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authContext?: any
  initialRoute?: string
}

export const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { authContext = createMockAuthContext(), initialRoute = '/', ...renderOptions } = options

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <AuthProvider value={authContext}>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }

// Common test helpers
export const waitForLoadingToFinish = async () => {
  const { waitForElementToBeRemoved } = await import('@testing-library/react')
  await waitForElementToBeRemoved(() => 
    document.querySelector('[data-testid="loading-indicator"]')
  )
}

export const expectElementToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
}

export const expectElementNotToBeInDocument = (element: HTMLElement | null) => {
  expect(element).not.toBeInTheDocument()
}

export const expectElementToHaveClass = (element: HTMLElement | null, className: string) => {
  expect(element).toHaveClass(className)
}

export const expectElementToHaveText = (element: HTMLElement | null, text: string) => {
  expect(element).toHaveTextContent(text)
}