import { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Worker } from '../../types'
import { Button } from '../ui/Button'
import { LoadingIndicator } from '../layout/LoadingIndicator'
import { handleError, showSuccess, setLoading, isLoading } from '../../utils/errorHandler'
import { createNotification } from '../notifications/NotificationCenter'
import {
  UserIcon,
  PhoneIcon,
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  CalendarIcon,
  CogIcon,
  BellIcon,
  KeyIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ChartBarIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

interface WorkerStats {
  totalJobs: number
  completedJobs: number
  averageRating: number
  totalEarnings: number
  weeklyHours: number
  completionRate: number
}

interface WorkerSchedule {
  day: string
  start_time: string
  end_time: string
  is_available: boolean
}

interface WorkerPreferences {
  max_jobs_per_day: number
  preferred_service_types: string[]
  max_travel_distance: number
  notification_preferences: {
    email: boolean
    sms: boolean
    push: boolean
  }
  auto_accept_jobs: boolean
  break_duration: number
}

export function WorkerProfile() {
  const { profile, updateProfile } = useAuthContext()
  const [worker, setWorker] = useState<Worker | null>(null)
  const [stats, setStats] = useState<WorkerStats>({
    totalJobs: 0,
    completedJobs: 0,
    averageRating: 0,
    totalEarnings: 0,
    weeklyHours: 0,
    completionRate: 0
  })
  const [schedule, setSchedule] = useState<WorkerSchedule[]>([])
  const [preferences, setPreferences] = useState<WorkerPreferences>({
    max_jobs_per_day: 8,
    preferred_service_types: ['regular', 'deep'],
    max_travel_distance: 15,
    notification_preferences: {
      email: true,
      sms: true,
      push: true
    },
    auto_accept_jobs: false,
    break_duration: 30
  })
  const [activeTab, setActiveTab] = useState<'profile' | 'schedule' | 'preferences' | 'earnings' | 'security'>('profile')
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    vehicle_info: '',
    emergency_contact: '',
    emergency_phone: ''
  })
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const loadingProfile = isLoading('load_worker_profile')
  const updatingProfile = isLoading('update_worker_profile')
  const updatingSchedule = isLoading('update_schedule')
  const updatingPreferences = isLoading('update_preferences')
  const changingPassword = isLoading('change_password')

  useEffect(() => {
    if (profile) {
      fetchWorkerProfile()
      fetchWorkerStats()
      fetchWorkerSchedule()
      fetchWorkerPreferences()
    }
  }, [profile])

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        phone: profile.phone || ''
      }))
    }
  }, [profile])

  const fetchWorkerProfile = async () => {
    if (!profile) return
    
    try {
      setLoading('load_worker_profile', true, 'Loading worker profile...')
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('profile_id', profile.id)
        .single()

      if (error) throw error

      setWorker(data)
      setFormData(prev => ({
        ...prev,
        vehicle_info: data.vehicle_info || '',
        emergency_contact: data.emergency_contact || '',
        emergency_phone: data.emergency_phone || ''
      }))
    } catch (error) {
      handleError(error, { action: 'fetch_worker_profile', userId: profile.id })
    } finally {
      setLoading('load_worker_profile', false)
    }
  }

  const fetchWorkerStats = async () => {
    if (!profile || !worker) return

    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('worker_id', worker.id)

      if (error) throw error

      const totalJobs = bookings?.length || 0
      const completedJobs = bookings?.filter(b => b.status === 'completed').length || 0
      const totalEarnings = bookings?.reduce((sum, b) => 
        b.status === 'completed' ? sum + (b.price * 0.7) : sum, 0) || 0
      const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0

      // Get reviews for average rating
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('worker_id', worker.id)

      if (reviewsError) throw reviewsError

      const averageRating = reviews?.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0

      setStats({
        totalJobs,
        completedJobs,
        averageRating,
        totalEarnings,
        weeklyHours: 0, // Would need time tracking
        completionRate
      })
    } catch (error) {
      handleError(error, { action: 'fetch_worker_stats', userId: profile.id })
    }
  }

  const fetchWorkerSchedule = async () => {
    if (!profile || !worker) return

    try {
      const { data, error } = await supabase
        .from('worker_schedules')
        .select('*')
        .eq('worker_id', worker.id)

      if (error) throw error

      const defaultSchedule = [
        { day: 'Monday', start_time: '09:00', end_time: '17:00', is_available: true },
        { day: 'Tuesday', start_time: '09:00', end_time: '17:00', is_available: true },
        { day: 'Wednesday', start_time: '09:00', end_time: '17:00', is_available: true },
        { day: 'Thursday', start_time: '09:00', end_time: '17:00', is_available: true },
        { day: 'Friday', start_time: '09:00', end_time: '17:00', is_available: true },
        { day: 'Saturday', start_time: '09:00', end_time: '15:00', is_available: false },
        { day: 'Sunday', start_time: '10:00', end_time: '14:00', is_available: false }
      ]

      setSchedule(data?.length > 0 ? data : defaultSchedule)
    } catch (error) {
      handleError(error, { action: 'fetch_worker_schedule', userId: profile.id })
    }
  }

  const fetchWorkerPreferences = async () => {
    if (!profile || !worker) return

    try {
      const { data, error } = await supabase
        .from('worker_preferences')
        .select('*')
        .eq('worker_id', worker.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setPreferences(data)
      }
    } catch (error) {
      handleError(error, { action: 'fetch_worker_preferences', userId: profile.id })
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !worker) return

    try {
      setLoading('update_worker_profile', true, 'Updating profile...')
      
      // Update profile
      const { error: profileError } = await updateProfile({
        full_name: formData.full_name,
        phone: formData.phone
      })

      if (profileError) throw profileError

      // Update worker-specific data
      const { error: workerError } = await supabase
        .from('workers')
        .update({
          vehicle_info: formData.vehicle_info,
          emergency_contact: formData.emergency_contact,
          emergency_phone: formData.emergency_phone
        })
        .eq('id', worker.id)

      if (workerError) throw workerError

      showSuccess('Profile updated successfully!')
      await createNotification(
        profile.id,
        'Profile Updated',
        'Your worker profile has been updated successfully.',
        'success'
      )
      
      await fetchWorkerProfile()
    } catch (error) {
      handleError(error, { action: 'update_worker_profile', userId: profile.id })
    } finally {
      setLoading('update_worker_profile', false)
    }
  }

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !worker) return

    try {
      setLoading('update_schedule', true, 'Updating schedule...')
      
      const { error } = await supabase
        .from('worker_schedules')
        .upsert(
          schedule.map(s => ({
            worker_id: worker.id,
            day: s.day,
            start_time: s.start_time,
            end_time: s.end_time,
            is_available: s.is_available
          })),
          { onConflict: 'worker_id,day' }
        )

      if (error) throw error

      showSuccess('Schedule updated successfully!')
      await createNotification(
        profile.id,
        'Schedule Updated',
        'Your work schedule has been updated successfully.',
        'success'
      )
    } catch (error) {
      handleError(error, { action: 'update_schedule', userId: profile.id })
    } finally {
      setLoading('update_schedule', false)
    }
  }

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !worker) return

    try {
      setLoading('update_preferences', true, 'Updating preferences...')
      
      const { error } = await supabase
        .from('worker_preferences')
        .upsert({
          worker_id: worker.id,
          ...preferences
        })

      if (error) throw error

      showSuccess('Preferences updated successfully!')
      await createNotification(
        profile.id,
        'Preferences Updated',
        'Your work preferences have been updated successfully.',
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
    
    if (name.startsWith('schedule_')) {
      const [, day, field] = name.split('_')
      setSchedule(prev => prev.map(s => 
        s.day === day 
          ? { ...s, [field]: type === 'checkbox' ? checked : value }
          : s
      ))
    } else if (name.startsWith('preference_')) {
      const prefField = name.replace('preference_', '')
      if (prefField.includes('notification_')) {
        const notifType = prefField.replace('notification_', '')
        setPreferences(prev => ({
          ...prev,
          notification_preferences: {
            ...prev.notification_preferences,
            [notifType]: checked
          }
        }))
      } else {
        setPreferences(prev => ({
          ...prev,
          [prefField]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
        }))
      }
    } else if (name.startsWith('password_')) {
      const passField = name.replace('password_', '')
      setPasswordData(prev => ({
        ...prev,
        [passField]: value
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <StarIcon
        key={i}
        className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  if (loadingProfile) {
    return <LoadingIndicator fullScreen size="lg" text="Loading worker profile..." />
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Worker Profile</h1>
        <p className="text-gray-600 mt-2">Manage your work profile, schedule, and preferences</p>
      </div>

      {/* Profile Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
        <div className="flex items-center">
          <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-white">
              {profile?.full_name?.[0]?.toUpperCase() || 'W'}
            </span>
          </div>
          <div className="ml-6 flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name || 'Worker'}</h2>
            <p className="text-gray-600">{profile?.email}</p>
            <div className="flex items-center mt-2 space-x-4">
              <div className="flex items-center text-sm font-medium text-purple-600">
                <ShieldCheckIcon className="h-4 w-4 mr-1" />
                Worker Account
              </div>
              <div className="flex items-center text-sm font-medium text-yellow-600">
                <div className="flex mr-1">
                  {renderStars(stats.averageRating)}
                </div>
                {stats.averageRating.toFixed(1)} Rating
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">${stats.totalEarnings.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Total Earnings</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <CheckCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <StarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <CreditCardIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">${(stats.totalEarnings * 0.2).toFixed(2)}</p>
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
              { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
              { id: 'preferences', label: 'Preferences', icon: CogIcon },
              { id: 'earnings', label: 'Earnings', icon: CreditCardIcon },
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
                    <TruckIcon className="inline h-4 w-4 mr-1" />
                    Vehicle Information
                  </label>
                  <input
                    type="text"
                    name="vehicle_info"
                    value={formData.vehicle_info}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 2020 Honda Civic, License: ABC123"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      name="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Emergency contact name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="emergency_phone"
                      value={formData.emergency_phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
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

          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Work Schedule</h3>
              
              <form onSubmit={handleScheduleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {schedule.map((day) => (
                    <div key={day.day} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-24">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name={`schedule_${day.day}_is_available`}
                            checked={day.is_available}
                            onChange={handleChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            {day.day}
                          </span>
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          name={`schedule_${day.day}_start_time`}
                          value={day.start_time}
                          onChange={handleChange}
                          disabled={!day.is_available}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          name={`schedule_${day.day}_end_time`}
                          value={day.end_time}
                          onChange={handleChange}
                          disabled={!day.is_available}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={updatingSchedule}
                    loadingText="Updating..."
                    variant="primary"
                    size="lg"
                  >
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Update Schedule
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Work Preferences</h3>
              
              <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Jobs Per Day
                    </label>
                    <input
                      type="number"
                      name="preference_max_jobs_per_day"
                      value={preferences.max_jobs_per_day}
                      onChange={handleChange}
                      min="1"
                      max="20"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Travel Distance (miles)
                    </label>
                    <input
                      type="number"
                      name="preference_max_travel_distance"
                      value={preferences.max_travel_distance}
                      onChange={handleChange}
                      min="1"
                      max="50"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notification Preferences
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="preference_notification_email"
                        checked={preferences.notification_preferences.email}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">Email notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="preference_notification_sms"
                        checked={preferences.notification_preferences.sms}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">SMS notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="preference_notification_push"
                        checked={preferences.notification_preferences.push}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">Push notifications</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="preference_auto_accept_jobs"
                      checked={preferences.auto_accept_jobs}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">Auto-accept jobs within preferences</span>
                  </label>
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

          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings Overview</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 rounded-lg p-6">
                  <h4 className="font-medium text-green-900 mb-2">Total Earnings</h4>
                  <p className="text-3xl font-bold text-green-600">${stats.totalEarnings.toFixed(2)}</p>
                  <p className="text-sm text-green-700 mt-1">From {stats.completedJobs} completed jobs</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="font-medium text-blue-900 mb-2">This Week</h4>
                  <p className="text-3xl font-bold text-blue-600">${(stats.totalEarnings * 0.2).toFixed(2)}</p>
                  <p className="text-sm text-blue-700 mt-1">Estimated weekly earnings</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <h4 className="font-medium text-purple-900 mb-2">Average Per Job</h4>
                  <p className="text-3xl font-bold text-purple-600">
                    ${stats.completedJobs > 0 ? (stats.totalEarnings / stats.completedJobs).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-sm text-purple-700 mt-1">After commission</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Earnings Information</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Earnings shown are your commission (70% of job price). Taxes are not deducted.
                      Please consult a tax professional for tax planning.
                    </p>
                  </div>
                </div>
              </div>
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