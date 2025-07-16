import { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useSubscription } from '../../hooks/useSubscription'
import { Button } from '../ui/Button'
import { LoadingIndicator } from '../layout/LoadingIndicator'
import { handleError, showSuccess, setLoading, isLoading } from '../../utils/errorHandler'
import { createNotification } from '../notifications/NotificationCenter'
import { 
  UserIcon, 
  PhoneIcon, 
  MapPinIcon, 
  EnvelopeIcon,
  CalendarIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  CogIcon,
  BellIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  StarIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface BookingHistory {
  id: string
  service_type: string
  scheduled_date: string
  status: string
  price: number
  worker_name?: string
  rating?: number
  review?: string
}

interface UserPreferences {
  email_notifications: boolean
  sms_notifications: boolean
  marketing_emails: boolean
  preferred_contact_method: 'email' | 'sms' | 'both'
  preferred_time_slots: string[]
  special_instructions: string
}

export function ProfilePage() {
  const { profile, updateProfile } = useAuthContext()
  const { subscription, calculateDiscountedPrice } = useSubscription()
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings' | 'preferences' | 'security'>('profile')
  const [bookingHistory, setBookingHistory] = useState<BookingHistory[]>([])
  const [preferences, setPreferences] = useState<UserPreferences>({
    email_notifications: true,
    sms_notifications: false,
    marketing_emails: true,
    preferred_contact_method: 'email',
    preferred_time_slots: ['morning'],
    special_instructions: ''
  })
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || ''
  })
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const updatingProfile = isLoading('update_profile')
  const loadingBookings = isLoading('load_bookings')
  const updatingPreferences = isLoading('update_preferences')
  const changingPassword = isLoading('change_password')

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || ''
      })
    }
  }, [profile])

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookingHistory()
    }
  }, [activeTab])

  const fetchBookingHistory = async () => {
    if (!profile) return
    
    try {
      setLoading('load_bookings', true, 'Loading booking history...')
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          service_type,
          scheduled_date,
          status,
          price,
          workers (
            profiles (full_name)
          ),
          reviews (
            rating,
            comment
          )
        `)
        .eq('user_id', profile.id)
        .order('scheduled_date', { ascending: false })
        .limit(10)

      if (error) throw error

      const formattedBookings = data?.map(booking => ({
        id: booking.id,
        service_type: booking.service_type,
        scheduled_date: booking.scheduled_date,
        status: booking.status,
        price: booking.price,
        worker_name: (booking.workers as any)?.profiles?.full_name || 'Not assigned',
        rating: booking.reviews?.[0]?.rating,
        review: booking.reviews?.[0]?.comment
      })) || []

      setBookingHistory(formattedBookings)
    } catch (error) {
      handleError(error, { action: 'fetch_booking_history', userId: profile.id })
    } finally {
      setLoading('load_bookings', false)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      setLoading('update_profile', true, 'Updating profile...')
      const { error } = await updateProfile(formData)
      if (error) {
        handleError(error, { action: 'update_profile', userId: profile.id })
      } else {
        showSuccess('Profile updated successfully!')
        await createNotification(
          profile.id,
          'Profile Updated',
          'Your profile information has been updated successfully.',
          'success'
        )
      }
    } catch (error) {
      handleError(error, { action: 'update_profile', userId: profile.id })
    } finally {
      setLoading('update_profile', false)
    }
  }

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      setLoading('update_preferences', true, 'Updating preferences...')
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: profile.id,
          ...preferences
        })

      if (error) throw error

      showSuccess('Preferences updated successfully!')
      await createNotification(
        profile.id,
        'Preferences Updated',
        'Your notification and service preferences have been updated.',
        'success'
      )
    } catch (error) {
      handleError(error, { action: 'update_preferences', userId: profile.id })
    } finally {
      setLoading('update_preferences', false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    if (passwordData.new_password !== passwordData.confirm_password) {
      handleError(new Error('New passwords do not match'), { action: 'change_password' })
      return
    }

    if (passwordData.new_password.length < 6) {
      handleError(new Error('Password must be at least 6 characters'), { action: 'change_password' })
      return
    }

    try {
      setLoading('change_password', true, 'Changing password...')
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      })

      if (error) throw error

      showSuccess('Password changed successfully!')
      await createNotification(
        profile.id,
        'Password Changed',
        'Your password has been changed successfully.',
        'success'
      )
      
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (error) {
      handleError(error, { action: 'change_password', userId: profile.id })
    } finally {
      setLoading('change_password', false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    if (name.startsWith('preference_')) {
      const prefName = name.replace('preference_', '')
      setPreferences(prev => ({
        ...prev,
        [prefName]: type === 'checkbox' ? checked : value
      }))
    } else if (name.startsWith('password_')) {
      const passName = name.replace('password_', '')
      setPasswordData(prev => ({
        ...prev,
        [passName]: value
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'in_progress':
        return 'text-blue-600 bg-blue-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <StarIcon
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
      </div>

      {/* Profile Summary Card */}
      <div className="bg-gradient-to-r from-primary-50 to-emerald-50 rounded-lg p-6 mb-8">
        <div className="flex items-center">
          <div className="h-16 w-16 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-white">
              {profile?.full_name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="ml-6 flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name || 'User'}</h2>
            <p className="text-gray-600">{profile?.email}</p>
            <div className="flex items-center mt-2">
              <span className="text-sm font-medium text-gray-500 capitalize mr-4">
                {profile?.role} Account
              </span>
              {subscription && (
                <div className="flex items-center text-sm font-medium text-emerald-600">
                  <ShieldCheckIcon className="h-4 w-4 mr-1" />
                  {subscription.tier.toUpperCase()} Member
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { id: 'profile', label: 'Profile Info', icon: UserIcon },
              { id: 'bookings', label: 'Booking History', icon: CalendarIcon },
              { id: 'preferences', label: 'Preferences', icon: CogIcon },
              { id: 'security', label: 'Security', icon: KeyIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <UserIcon className="inline h-4 w-4 mr-1" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <PhoneIcon className="inline h-4 w-4 mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <EnvelopeIcon className="inline h-4 w-4 mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPinIcon className="inline h-4 w-4 mr-1" />
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your address..."
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={updatingProfile}
                    loadingText="Updating..."
                    variant="primary"
                    size="lg"
                  >
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Update Profile
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Booking History</h3>
                <Button
                  onClick={fetchBookingHistory}
                  variant="outline"
                  size="sm"
                >
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {loadingBookings ? (
                <LoadingIndicator size="md" text="Loading bookings..." />
              ) : bookingHistory.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No bookings found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookingHistory.map((booking) => (
                    <div key={booking.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 capitalize">
                            {booking.service_type.replace('_', ' ')} Cleaning
                          </h4>
                          <p className="text-sm text-gray-600">
                            {new Date(booking.scheduled_date).toLocaleDateString()} • {booking.worker_name}
                          </p>
                          {booking.rating && (
                            <div className="flex items-center mt-2">
                              <div className="flex mr-2">
                                {renderStars(booking.rating)}
                              </div>
                              <span className="text-sm text-gray-600">
                                {booking.rating}/5 stars
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            ${booking.price.toFixed(2)}
                          </p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
              
              <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="preference_email_notifications"
                          checked={preferences.email_notifications}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">Booking confirmations</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="preference_marketing_emails"
                          checked={preferences.marketing_emails}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">Promotional emails</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="preference_sms_notifications"
                          checked={preferences.sms_notifications}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">SMS reminders</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    name="preference_special_instructions"
                    value={preferences.special_instructions}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Any special instructions for our cleaning team..."
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={updatingPreferences}
                    loadingText="Updating..."
                    variant="primary"
                    size="lg"
                  >
                    <BellIcon className="h-5 w-5 mr-2" />
                    Update Preferences
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
              
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password_new_password"
                        value={passwordData.new_password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password_confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Password Requirements</h4>
                      <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                        <li>At least 6 characters long</li>
                        <li>Include both letters and numbers</li>
                        <li>Avoid common passwords</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={changingPassword}
                    loadingText="Changing..."
                    variant="primary"
                    size="lg"
                  >
                    <KeyIcon className="h-5 w-5 mr-2" />
                    Change Password
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
