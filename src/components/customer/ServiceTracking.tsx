import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPinIcon, ClockIcon, PhoneIcon, UserIcon, ArrowPathIcon, SignalIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'
import { Booking } from '../../types'
import { MapContainer } from '../map/MapContainer'
import toast from 'react-hot-toast'

interface WorkerWithProfile {
  id: string
  status: string
  current_location_lat?: number
  current_location_lng?: number
  last_location_update?: string
  profiles?: {
    full_name: string
    phone?: string
  }
}

interface LocationUpdate {
  lat: number
  lng: number
  timestamp: string
  heading?: number
  speed?: number
}

export function ServiceTracking() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [worker, setWorker] = useState<WorkerWithProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [locationHistory, setLocationHistory] = useState<LocationUpdate[]>([])
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null)
  const [isLocationLive, setIsLocationLive] = useState(false)
  const locationUpdateRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails()
      
      // Subscribe to real-time updates for booking
      const bookingSubscription = supabase
        .channel('booking-updates')
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
        if (locationUpdateRef.current) {
          clearInterval(locationUpdateRef.current)
        }
      }
    }
  }, [bookingId])

  const startLocationTracking = useCallback(() => {
    if (!worker?.id) return

    // Subscribe to worker location updates
    const locationSubscription = supabase
      .channel('worker-location-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'workers',
        filter: `id=eq.${worker.id}`
      }, (payload) => {
        const updatedWorker = payload.new as WorkerWithProfile
        setWorker(prev => ({ ...prev!, ...updatedWorker }))
        setIsLocationLive(true)
        
        // Calculate ETA if worker is en route
        if (updatedWorker.current_location_lat && updatedWorker.current_location_lng && booking) {
          calculateETA(
            updatedWorker.current_location_lat,
            updatedWorker.current_location_lng,
            booking.location_lat!,
            booking.location_lng!
          )
        }
      })
      .subscribe()

    // Fetch location history
    fetchLocationHistory()

    // Set up periodic location refresh
    locationUpdateRef.current = setInterval(() => {
      fetchWorkerLocation()
    }, 30000) // Update every 30 seconds

    return () => {
      locationSubscription.unsubscribe()
    }
  }, [worker?.id, booking])

  const stopLocationTracking = useCallback(() => {
    if (locationUpdateRef.current) {
      clearInterval(locationUpdateRef.current)
    }
    setIsLocationLive(false)
  }, [])

  // Set up worker location tracking when worker is assigned
  useEffect(() => {
    if (worker?.id && (booking?.status === 'assigned' || booking?.status === 'en_route')) {
      startLocationTracking()
    } else {
      stopLocationTracking()
    }

    return () => stopLocationTracking()
  }, [worker?.id, booking?.status, startLocationTracking, stopLocationTracking])

  const fetchLocationHistory = async () => {
    if (!worker?.id) return

    try {
      const { data, error } = await supabase
        .from('worker_locations')
        .select('*')
        .eq('worker_id', worker.id)
        .gte('timestamp', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours
        .order('timestamp', { ascending: false })
        .limit(50)

      if (error) throw error

      const history: LocationUpdate[] = (data || []).map(loc => ({
        lat: loc.lat,
        lng: loc.lng,
        timestamp: loc.timestamp,
        heading: loc.heading,
        speed: loc.speed
      }))

      setLocationHistory(history)
    } catch (error) {
      console.error('Error fetching location history:', error)
    }
  }

  const fetchWorkerLocation = async () => {
    if (!worker?.id) return

    try {
      const { data, error } = await supabase
        .from('workers')
        .select('current_location_lat, current_location_lng, last_location_update')
        .eq('id', worker.id)
        .single()

      if (error) throw error

      if (data.current_location_lat && data.current_location_lng) {
        setWorker(prev => ({
          ...prev!,
          current_location_lat: data.current_location_lat,
          current_location_lng: data.current_location_lng,
          last_location_update: data.last_location_update
        }))

        // Check if location is recent (within 2 minutes)
        const lastUpdate = new Date(data.last_location_update)
        const now = new Date()
        const isRecent = (now.getTime() - lastUpdate.getTime()) < 2 * 60 * 1000
        setIsLocationLive(isRecent)
      }
    } catch (error) {
      console.error('Error fetching worker location:', error)
    }
  }

  const calculateETA = async (workerLat: number, workerLng: number, destLat: number, destLng: number) => {
    try {
      const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
      if (!mapboxToken) return

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${workerLng},${workerLat};${destLng},${destLat}?access_token=${mapboxToken}&geometries=geojson`
      )

      if (!response.ok) return

      const data = await response.json()
      if (data.routes && data.routes.length > 0) {
        const duration = data.routes[0].duration // in seconds
        const arrivalTime = new Date(Date.now() + duration * 1000)
        setEstimatedArrival(arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      }
    } catch (error) {
      console.error('Error calculating ETA:', error)
    }
  }

  const fetchBookingDetails = async () => {
    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

      if (bookingError) throw bookingError
      setBooking(bookingData)

      if (bookingData.worker_id) {
        const { data: workerData, error: workerError } = await supabase
          .from('workers')
          .select(`
            *,
            profiles(*)
          `)
          .eq('id', bookingData.worker_id)
          .single()

        if (workerError) throw workerError
        setWorker(workerData)
      }
    } catch (error) {
      console.error('Error fetching booking details:', error)
      toast.error('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'Your cleaner has been assigned and will be on their way soon.'
      case 'en_route':
        return 'Your cleaner is on their way to your location.'
      case 'in_progress':
        return 'Your cleaning service is currently in progress.'
      case 'completed':
        return 'Your cleaning service has been completed!'
      default:
        return 'Waiting for updates...'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'text-blue-600'
      case 'en_route': return 'text-purple-600'
      case 'in_progress': return 'text-indigo-600'
      case 'completed': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Booking not found</h2>
        <p className="mt-2 text-gray-600">The booking you're looking for doesn't exist.</p>
        <Link
          to="/customer/bookings"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          View All Bookings
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Track Your Service</h1>
        <Link
          to="/customer/bookings"
          className="text-blue-600 hover:text-blue-500"
        >
          ← Back to Bookings
        </Link>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-3 h-3 rounded-full ${
            booking.status === 'completed' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'
          }`}></div>
          <h2 className={`text-lg font-semibold ${getStatusColor(booking.status)}`}>
            {booking.status.replace('_', ' ').toUpperCase()}
          </h2>
        </div>
        <p className="text-gray-600 mb-4">{getStatusMessage(booking.status)}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ClockIcon className="h-4 w-4" />
            <span>Scheduled: {new Date(booking.scheduled_date).toLocaleDateString()} at {booking.scheduled_time}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4" />
            <span>{booking.address}</span>
          </div>
        </div>
      </div>

      {/* Worker Info */}
      {worker && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Cleaner</h3>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isLocationLive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <SignalIcon className="h-3 w-3 mr-1" />
                {isLocationLive ? 'Live' : 'Offline'}
              </div>
              {estimatedArrival && booking?.status === 'en_route' && (
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  ETA: {estimatedArrival}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{worker.profiles?.full_name}</h4>
              <p className="text-sm text-gray-500">Professional Cleaner</p>
              {worker.last_location_update && (
                <p className="text-xs text-gray-400">
                  Last seen: {new Date(worker.last_location_update).toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              {worker.profiles?.phone && (
                <a
                  href={`tel:${worker.profiles.phone}`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Call
                </a>
              )}
              <button
                onClick={fetchWorkerLocation}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      {worker?.current_location_lat && worker?.current_location_lng && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Location</h3>
          <div className="h-64 rounded-lg overflow-hidden">
            <MapContainer
              center={[worker.current_location_lng, worker.current_location_lat]}
              zoom={14}
            />
          </div>
        </div>
      )}

      {/* Service Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Service Type:</span>
            <span className="font-medium">{booking.service_type.replace('_', ' ').toUpperCase()} Cleaning</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-medium">${booking.price}</span>
          </div>
          {booking.notes && (
            <div>
              <span className="text-gray-600">Special Instructions:</span>
              <p className="mt-1 text-sm text-gray-900">{booking.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {booking.status === 'completed' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Completed</h3>
          <p className="text-gray-600 mb-4">How was your cleaning service?</p>
          <div className="flex space-x-3">
            <Link
              to={`/reviews/new?booking=${booking.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Leave a Review
            </Link>
            <Link
              to="/book"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Book Again
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
