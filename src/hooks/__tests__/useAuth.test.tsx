import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../useAuth'
import { createMockSupabaseClient, createMockProfile } from '../../test/utils'

// Mock dependencies
vi.mock('../../lib/supabase', () => ({
  supabase: createMockSupabaseClient(),
}))

vi.mock('../../utils/errorHandler', () => ({
  handleError: vi.fn(),
  showSuccess: vi.fn(),
}))

describe('useAuth Hook', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    vi.clearAllMocks()
  })

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.profile).toBeNull()
  })

  it('handles successful authentication', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com' }
    const mockProfile = createMockProfile()
    
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    })
    
    mockSupabase.from.mockReturnValue({
      ...mockSupabase.from(),
      single: vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      }),
    })

    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      // Wait for initialization
    })
    
    expect(result.current.loading).toBe(false)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.profile).toEqual(mockProfile)
  })

  it('handles sign in', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com' }
    
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
    
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'password')
      expect(response.success).toBe(true)
    })
    
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    })
  })

  it('handles sign in error', async () => {
    const mockError = new Error('Invalid credentials')
    
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: mockError,
    })
    
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'wrongpassword')
      expect(response.success).toBe(false)
      expect(response.error).toBe(mockError)
    })
  })

  it('handles sign up', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com' }
    
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
    
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      const response = await result.current.signUp('test@example.com', 'password', {
        full_name: 'Test User',
        role: 'customer',
      })
      expect(response.success).toBe(true)
    })
    
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      options: {
        data: {
          full_name: 'Test User',
          role: 'customer',
        },
      },
    })
  })

  it('handles sign out', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null,
    })
    
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.signOut()
    })
    
    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    expect(result.current.user).toBeNull()
    expect(result.current.profile).toBeNull()
  })

  it('handles profile update', async () => {
    const mockProfile = createMockProfile()
    const updatedProfile = { ...mockProfile, full_name: 'Updated Name' }
    
    mockSupabase.from.mockReturnValue({
      ...mockSupabase.from(),
      single: vi.fn().mockResolvedValue({
        data: updatedProfile,
        error: null,
      }),
    })
    
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      const response = await result.current.updateProfile({
        full_name: 'Updated Name',
      })
      expect(response.success).toBe(true)
    })
    
    expect(result.current.profile?.full_name).toBe('Updated Name')
  })

  it('handles OAuth sign in', async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://oauth.url' },
      error: null,
    })
    
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      const response = await result.current.signInWithOAuth('google')
      expect(response.success).toBe(true)
    })
    
    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('/auth/callback'),
      },
    })
  })

  it('handles password reset', async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null,
    })
    
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      const response = await result.current.resetPassword('test@example.com')
      expect(response.success).toBe(true)
    })
    
    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'test@example.com',
      {
        redirectTo: expect.stringContaining('/auth/reset-password'),
      }
    )
  })

  it('subscribes to auth state changes', () => {
    const mockOnAuthStateChange = vi.fn()
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
    
    renderHook(() => useAuth())
    
    expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
  })
})