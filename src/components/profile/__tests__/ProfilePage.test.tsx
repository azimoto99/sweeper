import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../test/utils'
import { ProfilePage } from '../ProfilePage'
import { createMockAuthContext, createMockProfile } from '../../../test/utils'

// Mock dependencies
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      then: vi.fn(),
    })),
    auth: {
      updateUser: vi.fn(),
    },
  },
}))

vi.mock('../../../utils/errorHandler', () => ({
  handleError: vi.fn(),
  showSuccess: vi.fn(),
  setLoading: vi.fn(),
  isLoading: vi.fn(() => false),
}))

vi.mock('../../../hooks/useSubscription', () => ({
  useSubscription: () => ({
    subscription: {
      tier: 'silver',
      status: 'active',
    },
    calculateDiscountedPrice: vi.fn(),
  }),
}))

vi.mock('../../notifications/NotificationCenter', () => ({
  createNotification: vi.fn(),
}))

describe('ProfilePage Component', () => {
  let mockAuthContext: ReturnType<typeof createMockAuthContext>

  beforeEach(() => {
    mockAuthContext = createMockAuthContext({
      profile: createMockProfile(),
      updateProfile: vi.fn(),
    })
    vi.clearAllMocks()
  })

  it('renders profile page with tabs', () => {
    render(<ProfilePage />, { authContext: mockAuthContext })

    expect(screen.getByText('Profile Settings')).toBeInTheDocument()
    expect(screen.getByText('Profile Info')).toBeInTheDocument()
    expect(screen.getByText('Booking History')).toBeInTheDocument()
    expect(screen.getByText('Preferences')).toBeInTheDocument()
    expect(screen.getByText('Security')).toBeInTheDocument()
  })

  it('displays user information in profile summary', () => {
    render(<ProfilePage />, { authContext: mockAuthContext })

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('SILVER Member')).toBeInTheDocument()
  })

  it('switches tabs correctly', () => {
    render(<ProfilePage />, { authContext: mockAuthContext })

    // Default tab should be Profile Info
    expect(screen.getByText('Personal Information')).toBeInTheDocument()

    // Switch to Booking History tab
    fireEvent.click(screen.getByText('Booking History'))
    expect(screen.getByText('Booking History')).toBeInTheDocument()

    // Switch to Preferences tab
    fireEvent.click(screen.getByText('Preferences'))
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument()

    // Switch to Security tab
    fireEvent.click(screen.getByText('Security'))
    expect(screen.getByText('Security Settings')).toBeInTheDocument()
  })

  it('submits profile form', async () => {
    const mockUpdateProfile = vi.fn().mockResolvedValue({ success: true })
    mockAuthContext.updateProfile = mockUpdateProfile

    render(<ProfilePage />, { authContext: mockAuthContext })

    const nameInput = screen.getByDisplayValue('Test User')
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })

    const phoneInput = screen.getByDisplayValue('+1234567890')
    fireEvent.change(phoneInput, { target: { value: '+1987654321' } })

    const submitButton = screen.getByText('Update Profile')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        full_name: 'Updated Name',
        phone: '+1987654321',
        address: '123 Test St, Test City, TX 12345',
      })
    })
  })

  it('handles profile form validation', async () => {
    render(<ProfilePage />, { authContext: mockAuthContext })

    const nameInput = screen.getByDisplayValue('Test User')
    fireEvent.change(nameInput, { target: { value: '' } })

    const submitButton = screen.getByText('Update Profile')
    fireEvent.click(submitButton)

    // Form should not submit with empty required field
    await waitFor(() => {
      expect(mockAuthContext.updateProfile).not.toHaveBeenCalled()
    })
  })

  it('displays booking history when tab is selected', async () => {
    const mockSupabase = vi.mocked(require('../../../lib/supabase').supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            service_type: 'regular',
            scheduled_date: '2024-01-15',
            status: 'completed',
            price: 100,
            workers: { profiles: { full_name: 'Worker Name' } },
            reviews: [{ rating: 5, comment: 'Great service!' }],
          },
        ],
        error: null,
      }),
    })

    render(<ProfilePage />, { authContext: mockAuthContext })

    fireEvent.click(screen.getByText('Booking History'))

    await waitFor(() => {
      expect(screen.getByText('Regular Cleaning')).toBeInTheDocument()
      expect(screen.getByText('$100.00')).toBeInTheDocument()
    })
  })

  it('handles password change', async () => {
    const mockSupabase = vi.mocked(require('../../../lib/supabase').supabase)
    mockSupabase.auth.updateUser.mockResolvedValue({ error: null })

    render(<ProfilePage />, { authContext: mockAuthContext })

    // Switch to Security tab
    fireEvent.click(screen.getByText('Security'))

    const newPasswordInput = screen.getByPlaceholderText('Enter new password')
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })

    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password')
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })

    const changePasswordButton = screen.getByText('Change Password')
    fireEvent.click(changePasswordButton)

    await waitFor(() => {
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      })
    })
  })

  it('validates password confirmation', async () => {
    render(<ProfilePage />, { authContext: mockAuthContext })

    fireEvent.click(screen.getByText('Security'))

    const newPasswordInput = screen.getByPlaceholderText('Enter new password')
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })

    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password')
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } })

    const changePasswordButton = screen.getByText('Change Password')
    fireEvent.click(changePasswordButton)

    // Should not update password if confirmation doesn't match
    await waitFor(() => {
      expect(require('../../../lib/supabase').supabase.auth.updateUser).not.toHaveBeenCalled()
    })
  })

  it('updates notification preferences', async () => {
    const mockSupabase = vi.mocked(require('../../../lib/supabase').supabase)
    mockSupabase.from.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })

    render(<ProfilePage />, { authContext: mockAuthContext })

    fireEvent.click(screen.getByText('Preferences'))

    const emailCheckbox = screen.getByLabelText('Booking confirmations')
    fireEvent.click(emailCheckbox)

    const updateButton = screen.getByText('Update Preferences')
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('user_preferences')
    })
  })

  it('shows loading states', () => {
    const mockIsLoading = vi.fn()
    mockIsLoading.mockReturnValue(true)
    vi.mocked(require('../../../utils/errorHandler').isLoading).mockImplementation(mockIsLoading)

    render(<ProfilePage />, { authContext: mockAuthContext })

    // Should show loading states for buttons
    expect(screen.getByText('Update Profile')).toBeDisabled()
  })

  it('handles errors gracefully', async () => {
    const mockUpdateProfile = vi.fn().mockRejectedValue(new Error('Update failed'))
    mockAuthContext.updateProfile = mockUpdateProfile

    render(<ProfilePage />, { authContext: mockAuthContext })

    const submitButton = screen.getByText('Update Profile')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(require('../../../utils/errorHandler').handleError).toHaveBeenCalled()
    })
  })

  it('displays user avatar with initials', () => {
    render(<ProfilePage />, { authContext: mockAuthContext })

    expect(screen.getByText('T')).toBeInTheDocument() // First letter of "Test User"
  })

  it('shows subscription tier badge', () => {
    render(<ProfilePage />, { authContext: mockAuthContext })

    expect(screen.getByText('SILVER Member')).toBeInTheDocument()
  })
})