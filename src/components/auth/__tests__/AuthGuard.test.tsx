import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/utils'
import { AuthGuard } from '../AuthGuard'
import { createMockAuthContext, createMockProfile } from '../../../test/utils'

// Mock router
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
}))

describe('AuthGuard Component', () => {
  it('renders children when user is authenticated', () => {
    const mockContext = createMockAuthContext({
      user: { id: 'test-user', email: 'test@example.com' },
      profile: createMockProfile(),
      loading: false,
    })

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
      { authContext: mockContext }
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('shows loading indicator when loading', () => {
    const mockContext = createMockAuthContext({
      user: null,
      profile: null,
      loading: true,
    })

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
      { authContext: mockContext }
    )

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', () => {
    const mockContext = createMockAuthContext({
      user: null,
      profile: null,
      loading: false,
    })

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
      { authContext: mockContext }
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('checks role permissions', () => {
    const mockContext = createMockAuthContext({
      user: { id: 'test-user', email: 'test@example.com' },
      profile: createMockProfile({ role: 'customer' }),
      loading: false,
    })

    render(
      <AuthGuard roles={['admin']}>
        <div>Admin Content</div>
      </AuthGuard>,
      { authContext: mockContext }
    )

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('allows access when user has correct role', () => {
    const mockContext = createMockAuthContext({
      user: { id: 'test-user', email: 'test@example.com' },
      profile: createMockProfile({ role: 'admin' }),
      loading: false,
    })

    render(
      <AuthGuard roles={['admin']}>
        <div>Admin Content</div>
      </AuthGuard>,
      { authContext: mockContext }
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('allows access when user has one of multiple roles', () => {
    const mockContext = createMockAuthContext({
      user: { id: 'test-user', email: 'test@example.com' },
      profile: createMockProfile({ role: 'worker' }),
      loading: false,
    })

    render(
      <AuthGuard roles={['admin', 'worker']}>
        <div>Worker Content</div>
      </AuthGuard>,
      { authContext: mockContext }
    )

    expect(screen.getByText('Worker Content')).toBeInTheDocument()
  })

  it('renders custom loading component', () => {
    const mockContext = createMockAuthContext({
      user: null,
      profile: null,
      loading: true,
    })

    const CustomLoading = () => <div>Custom Loading</div>

    render(
      <AuthGuard loadingComponent={<CustomLoading />}>
        <div>Protected Content</div>
      </AuthGuard>,
      { authContext: mockContext }
    )

    expect(screen.getByText('Custom Loading')).toBeInTheDocument()
  })

  it('renders fallback when no access', () => {
    const mockContext = createMockAuthContext({
      user: { id: 'test-user', email: 'test@example.com' },
      profile: createMockProfile({ role: 'customer' }),
      loading: false,
    })

    const Fallback = () => <div>Access Denied</div>

    render(
      <AuthGuard roles={['admin']} fallback={<Fallback />}>
        <div>Admin Content</div>
      </AuthGuard>,
      { authContext: mockContext }
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })
})