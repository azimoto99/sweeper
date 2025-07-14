import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Worker } from '../../types'
import { useNotify } from '../../hooks/useNotify'
import { sendSystemNotification } from '../../lib/notifications'
import {
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  CalendarIcon,
  StarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TruckIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'

interface WorkerWithProfile extends Worker {
  profiles?: {
    full_name: string
    email: string
    phone?: string
    created_at: string
  }
}

interface AddWorkerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddWorkerModal({ isOpen, onClose, onSuccess }: AddWorkerModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    password: '',
    vehicle_info: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const notify = useNotify()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.full_name || !formData.password) {
      notify.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: 'worker'
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.full_name,
            phone: formData.phone || null,
            role: 'worker'
          })

        if (profileError) throw profileError

        // Create worker entry
        const { error: workerError } = await supabase
          .from('workers')
          .insert({
            profile_id: authData.user.id,
            status: 'offline',
            vehicle_info: formData.vehicle_info || null,
            assigned_bookings_count: 0
          })

        if (workerError) throw workerError

        // Send welcome notification
        await sendSystemNotification(
          [authData.user.id],
          'Welcome to Margarita\'s Cleaning Services',
          'Your worker account has been created. You can now log in and start receiving job assignments.',
          'success'
        )

        notify.success('Worker added successfully!')
        onSuccess()
        
        // Reset form
        setFormData({
          email: '',
          full_name: '',
          phone: '',
          password: '',
          vehicle_info: ''
        })
      }
    } catch (error) {
      console.error('Error adding worker:', error)
      notify.error('Failed to add worker')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add New Worker</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter full name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Information
            </label>
            <div className="relative">
              <TruckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.vehicle_info}
                onChange={(e) => setFormData({ ...formData, vehicle_info: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 2020 Honda Civic - ABC123"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Worker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface EditWorkerModalProps {
  worker: WorkerWithProfile
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditWorkerModal({ worker, isOpen, onClose, onSuccess }: EditWorkerModalProps) {
  const [formData, setFormData] = useState({
    full_name: worker.profiles?.full_name || '',
    phone: worker.profiles?.phone || '',
    vehicle_info: worker.vehicle_info || ''
  })
  const [loading, setLoading] = useState(false)
  const notify = useNotify()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.full_name) {
      notify.error('Full name is required')
      return
    }

    try {
      setLoading(true)

      // Update profile
      const { error: profileError } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', worker.id)

      if (profileError) throw profileError

      // Update worker info
      const { error: workerError } = await supabase
        .from('workers')
        .update({
          vehicle_info: formData.vehicle_info || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', worker.id)

      if (workerError) throw workerError

      // Send notification about profile update
      await sendSystemNotification(
        [worker.id],
        'Profile Updated',
        'Your profile information has been updated by administration.',
        'info'
      )

      notify.success('Worker updated successfully!')
      onSuccess()
    } catch (error) {
      console.error('Error updating worker:', error)
      notify.error('Failed to update worker')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Edit Worker</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter full name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Information
            </label>
            <div className="relative">
              <TruckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.vehicle_info}
                onChange={(e) => setFormData({ ...formData, vehicle_info: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 2020 Honda Civic - ABC123"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Worker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface WorkerDetailsModalProps {
  worker: WorkerWithProfile
  isOpen: boolean
  onClose: () => void
}

export function WorkerDetailsModal({ worker, isOpen, onClose }: WorkerDetailsModalProps) {
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchRecentBookings()
    }
  }, [isOpen, worker.id])

  const fetchRecentBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles!bookings_user_id_fkey(full_name, phone)
        `)
        .eq('worker_id', worker.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      
      setRecentBookings(data || [])
    } catch (error) {
      console.error('Error fetching recent bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'en_route':
        return 'bg-purple-100 text-purple-800'
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatLastSeen = () => {
    if (!worker.last_location_update) return 'Never'
    
    const lastSeen = new Date(worker.last_location_update)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return lastSeen.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Worker Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Name:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {worker.profiles?.full_name}
                </span>
              </div>
              <div className="flex items-center">
                <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Email:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {worker.profiles?.email}
                </span>
              </div>
              {worker.profiles?.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Phone:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {worker.profiles.phone}
                  </span>
                </div>
              )}
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Joined:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {new Date(worker.profiles?.created_at || '').toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Work Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <CogIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(worker.status)}`}>
                  {worker.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center">
                <StarIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Assigned Jobs:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {worker.assigned_bookings_count}
                </span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Last Location:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {formatLastSeen()}
                </span>
              </div>
              {worker.vehicle_info && (
                <div className="flex items-center">
                  <TruckIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Vehicle:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {worker.vehicle_info}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Bookings */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Bookings</h4>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentBookings.length === 0 ? (
              <p className="text-sm text-gray-500">No recent bookings</p>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-900">
                        {booking.service_type.replace('_', ' ').toUpperCase()}
                      </h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Customer: {booking.profiles?.full_name}</div>
                      <div>Date: {booking.scheduled_date} at {booking.scheduled_time}</div>
                      <div>Price: ${booking.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}