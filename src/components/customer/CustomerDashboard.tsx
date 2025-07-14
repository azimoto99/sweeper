import { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Booking } from '../../types'
import { CustomerTracker } from './CustomerTracker'
import { useNotify } from '../../hooks/useNotify'
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserIcon,
  TruckIcon,
  PlayIcon,
  PlusIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'

export function CustomerDashboard() {
  const { profile } = useAuthContext()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')
  const notify = useNotify()

  useEffect(() => {
    if (profile) {
      fetchBookings()
      
      // Set up real-time subscription for booking updates
      const bookingsSubscription = supabase
        .channel('customer_bookings')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'bookings',
          filter: `user_id=eq.${profile.id}`
        }, () => {
          fetchBookings()
        })
        .subscribe()

      return () => {
        bookingsSubscription.unsubscribe()
      }
    }
  }, [profile])

  const fetchBookings = async () => {
    if (!profile) return
    
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles!bookings_user_id_fkey(full_name, phone, email)
        `)
        .eq('user_id', profile.id)
        .order('scheduled_date', { ascending: false })

      if (error) throw error
      
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
      notify.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Finding Worker', color: 'yellow', icon: ClockIcon }
      case 'assigned':
        return { text: 'Worker Assigned', color: 'blue', icon: UserIcon }
      case 'en_route':
        return { text: 'En Route', color: 'purple', icon: TruckIcon }
      case 'in_progress':
        return { text: 'In Progress', color: 'indigo', icon: PlayIcon }
      case 'completed':
        return { text: 'Completed', color: 'green', icon: CheckCircleIcon }
      case 'cancelled':
        return { text: 'Cancelled', color: 'red', icon: ExclamationTriangleIcon }
      default:
        return { text: 'Unknown', color: 'gray', icon: ClockIcon }
    }
  }

  const isActiveBooking = (booking: Booking) => {
    return ['pending', 'assigned', 'en_route', 'in_progress'].includes(booking.status)
  }

  const activeBookings = bookings.filter(isActiveBooking)
  const historyBookings = bookings.filter(b => !isActiveBooking(b))

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600">Track your cleaning services and history</p>
          </div>
          <button 
            onClick={() => window.location.href = '/booking'}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Book Service
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'active'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active Services ({activeBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            History ({historyBookings.length})
          </button>
        </div>
      </div>

      {/* Active Services */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {activeBookings.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active services</h3>
              <p className="text-gray-600 mb-4">Book your first cleaning service to get started</p>
              <button 
                onClick={() => window.location.href = '/booking'}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Book Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeBookings.map((booking) => (
                <ActiveBookingCard
                  key={booking.id}
                  booking={booking}
                  onTrack={() => setSelectedBooking(booking)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {historyBookings.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No service history</h3>
              <p className="text-gray-600">Your completed services will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyBookings.map((booking) => (
                <HistoryBookingCard
                  key={booking.id}
                  booking={booking}
                  onView={() => setSelectedBooking(booking)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tracking Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Service Details
              </h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CustomerTracker bookingId={selectedBooking.id} />
          </div>
        </div>
      )}
    </div>
  )
}

function ActiveBookingCard({ booking, onTrack }: { booking: Booking; onTrack: () => void }) {
  const statusInfo = getStatusInfo(booking.status)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }
  
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {booking.service_type.replace('_', ' ').toUpperCase()}
          </h3>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
            <statusInfo.icon className="h-3 w-3 mr-1" />
            {statusInfo.text}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">${booking.price}</div>
        </div>
      </div>

      <div className="space-y-3 text-sm text-gray-600">
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2" />
          {formatDate(booking.scheduled_date)} at {formatTime(booking.scheduled_time)}
        </div>
        <div className="flex items-center">
          <MapPinIcon className="h-4 w-4 mr-2" />
          <span className="truncate">{booking.address}</span>
        </div>
      </div>

      <div className="mt-6 flex space-x-3">
        <button
          onClick={onTrack}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <EyeIcon className="h-4 w-4 mr-2" />
          Track Service
        </button>
        {booking.status === 'assigned' && (
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

function HistoryBookingCard({ booking, onView }: { booking: Booking; onView: () => void }) {
  const statusInfo = getStatusInfo(booking.status)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }
  
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900">
              {booking.service_type.replace('_', ' ').toUpperCase()}
            </h3>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
              <statusInfo.icon className="h-3 w-3 mr-1" />
              {statusInfo.text}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {formatDate(booking.scheduled_date)} at {formatTime(booking.scheduled_time)}
            </div>
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-4 w-4 mr-2" />
              ${booking.price}
            </div>
            <div className="flex items-center md:col-span-2">
              <MapPinIcon className="h-4 w-4 mr-2" />
              <span className="truncate">{booking.address}</span>
            </div>
          </div>
        </div>

        <div className="ml-4 flex space-x-2">
          <button
            onClick={onView}
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View
          </button>
          {booking.status === 'completed' && (
            <button className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
              Review
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'pending':
      return { text: 'Finding Worker', color: 'yellow', icon: ClockIcon }
    case 'assigned':
      return { text: 'Worker Assigned', color: 'blue', icon: UserIcon }
    case 'en_route':
      return { text: 'En Route', color: 'purple', icon: TruckIcon }
    case 'in_progress':
      return { text: 'In Progress', color: 'indigo', icon: PlayIcon }
    case 'completed':
      return { text: 'Completed', color: 'green', icon: CheckCircleIcon }
    case 'cancelled':
      return { text: 'Cancelled', color: 'red', icon: ExclamationTriangleIcon }
    default:
      return { text: 'Unknown', color: 'gray', icon: ClockIcon }
  }
}