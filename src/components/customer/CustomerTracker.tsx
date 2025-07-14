import { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Booking, Worker } from '../../types'
import { MapContainer } from '../map/MapContainer'
import { useNotify } from '../../hooks/useNotify'
import {
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  CheckCircleIcon,
  TruckIcon,
  PlayIcon,
  PauseIcon,
  UserIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

interface CustomerTrackerProps {
  bookingId?: string
  className?: string
}

export function CustomerTracker({ bookingId, className = '' }: CustomerTrackerProps) {
  const { profile } = useAuthContext()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [worker, setWorker] = useState<Worker | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null)
  const [isWorkerOnline, setIsWorkerOnline] = useState(false)
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null)
  const notify = useNotify()

  useEffect(() => {
    if (profile && bookingId) {
      fetchBookingData()
      
      // Set up real-time subscriptions for booking updates
      const bookingSubscription = supabase
        .channel('customer_booking')
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        }, (payload) => {
          setBooking(payload.new as Booking)
        })
        .subscribe()

      return () => {
        bookingSubscription.unsubscribe()
      }
    }
  }, [profile, bookingId])

  // Set up worker location subscription when worker is assigned
  useEffect(() => {
    if (worker && booking?.status !== 'completed') {
      const locationSubscription = supabase
        .channel('customer_worker_location')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'worker_locations',
          filter: `worker_id=eq.${worker.id}`
        }, () => {
          fetchWorkerLocation()
        })
        .subscribe()

      // Set up an interval to check worker location every 30 seconds
      const intervalId = setInterval(fetchWorkerLocation, 30000)

      return () => {
        locationSubscription.unsubscribe()
        clearInterval(intervalId)
      }
    }
  }, [worker, booking?.status])

  const fetchBookingData = async () => {
    if (!bookingId) return
    
    try {
      setLoading(true)
      
      // Fetch booking with customer profile
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles!bookings_user_id_fkey(full_name, phone, email)
        `)
        .eq('id', bookingId)
        .eq('user_id', profile!.id) // Ensure customer can only see their own bookings
        .single()

      if (bookingError) throw bookingError
      
      setBooking(bookingData)

      // If booking has a worker assigned, fetch worker data
      if (bookingData.worker_id) {
        await fetchWorkerData(bookingData.worker_id)
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
      notify.error('Failed to load booking information')
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkerData = async (workerId: string) => {
    try {
      const { data: workerData, error: workerError } = await supabase
        .from('workers')
        .select(`
          *,
          profiles!workers_profile_id_fkey(full_name, phone, email)
        `)
        .eq('id', workerId)
        .single()

      if (workerError) throw workerError
      
      // Transform data to match expected format
      const transformedWorker = {
        ...workerData,
        current_location: workerData.current_location_lat && workerData.current_location_lng 
          ? { lat: workerData.current_location_lat, lng: workerData.current_location_lng }
          : null
      }
      
      setWorker(transformedWorker)
      await fetchWorkerLocation(transformedWorker)
    } catch (error) {
      console.error('Error fetching worker:', error)
      notify.error('Failed to load worker information')
    }
  }

  const fetchWorkerLocation = async (currentWorker = worker) => {
    if (!currentWorker) return
    
    try {
      // Get latest location update
      const { data: locationData, error: locationError } = await supabase
        .from('worker_locations')
        .select('*')
        .eq('worker_id', currentWorker.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (locationError) throw locationError
      
      if (locationData && locationData.length > 0) {
        const latestLocation = locationData[0]
        setLastLocationUpdate(new Date(latestLocation.created_at))
        
        // Check if worker is online (location update within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        setIsWorkerOnline(new Date(latestLocation.created_at) > fiveMinutesAgo)
        
        // Update worker location
        setWorker(prev => prev ? {
          ...prev,
          current_location: {
            lat: latestLocation.latitude,
            lng: latestLocation.longitude
          },
          last_location_update: latestLocation.created_at
        } : null)
      }
    } catch (error) {
      console.error('Error fetching worker location:', error)
    }
  }

  const getStatusInfo = () => {
    if (!booking) return { text: 'Loading...', color: 'gray', icon: InformationCircleIcon }
    
    switch (booking.status) {
      case 'pending':
        return { text: 'Booking Confirmed - Finding Worker', color: 'yellow', icon: ClockIcon }
      case 'assigned':
        return { text: 'Worker Assigned', color: 'blue', icon: UserIcon }
      case 'en_route':
        return { text: 'Worker En Route', color: 'purple', icon: TruckIcon }
      case 'in_progress':
        return { text: 'Service In Progress', color: 'indigo', icon: PlayIcon }
      case 'completed':
        return { text: 'Service Completed', color: 'green', icon: CheckCircleIcon }
      case 'cancelled':
        return { text: 'Booking Cancelled', color: 'red', icon: ExclamationTriangleIcon }
      default:
        return { text: 'Unknown Status', color: 'gray', icon: InformationCircleIcon }
    }
  }

  const formatTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const canTrackWorker = () => {
    return worker && ['assigned', 'en_route', 'in_progress'].includes(booking?.status || '')
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Booking not found</p>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo()

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Service Tracking</h2>
            <p className="text-sm text-gray-600">
              {booking.service_type.replace('_', ' ').toUpperCase()} • {booking.scheduled_date}
            </p>
          </div>
          <div className={`flex items-center px-3 py-2 rounded-full text-sm font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
            <statusInfo.icon className="h-4 w-4 mr-2" />
            {statusInfo.text}
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-gray-600">Scheduled:</span>
            <span className="ml-2 font-medium">{booking.scheduled_date} at {booking.scheduled_time}</span>
          </div>
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-gray-600">Total:</span>
            <span className="ml-2 font-medium">${booking.price}</span>
          </div>
          <div className="flex items-center md:col-span-2">
            <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-gray-600">Address:</span>
            <span className="ml-2 font-medium">{booking.address}</span>
          </div>
        </div>
      </div>

      {/* Worker Information */}
      {worker && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Worker</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">
                  {(worker as any).profiles?.full_name || 'Your Worker'}
                </p>
                {(worker as any).profiles?.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-1" />
                    {(worker as any).profiles.phone}
                  </div>
                )}
                {lastLocationUpdate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last seen: {formatTimeSince(lastLocationUpdate)}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isWorkerOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${isWorkerOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                {isWorkerOnline ? 'Online' : 'Offline'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Status: {worker.status.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Map */}
      {canTrackWorker() && worker?.current_location && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Worker Location</h3>
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <MapContainer
              workers={[worker]}
              bookings={[booking]}
              center={[worker.current_location.lat, worker.current_location.lng]}
              zoom={15}
              className="w-full h-64"
              showServiceArea={false}
              showTraffic={true}
              showRoutes={true}
            />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>Worker is currently {worker.status.replace('_', ' ')}</span>
              {estimatedArrival && (
                <span className="font-medium">ETA: {estimatedArrival}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Worker Assigned */}
      {!worker && booking.status === 'pending' && (
        <div className="p-6 border-b border-gray-200">
          <div className="text-center text-gray-500">
            <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="font-medium">Finding the perfect worker for your service</p>
            <p className="text-sm mt-2">You'll be notified once a worker is assigned to your booking</p>
          </div>
        </div>
      )}

      {/* Service Notes */}
      {booking.notes && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Service Notes</h3>
          <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">
            {booking.notes}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="p-6">
        <div className="flex space-x-4">
          {worker && (worker as any).profiles?.phone && (
            <button
              onClick={() => window.open(`tel:${(worker as any).profiles.phone}`)}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <PhoneIcon className="h-4 w-4 mr-2" />
              Call Worker
            </button>
          )}
          {booking.status === 'completed' && (
            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Leave Review
            </button>
          )}
          {['pending', 'assigned'].includes(booking.status) && (
            <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    </div>
  )
}