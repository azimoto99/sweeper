import React, { useState, useEffect } from 'react'
import { MapPinIcon, ClockIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { MapContainer } from '../map/MapContainer'
import toast from 'react-hot-toast'

interface ActiveBooking {
  id: string
  service_type: string
  scheduled_time: string
  address: string
  status: string
  worker?: {
    id: string
    profiles?: {
      full_name: string
      phone?: string
    }
    current_location_lat?: number
    current_location_lng?: number
  }
}

export function CustomerTracker() {
  const { profile } = useAuthContext()
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveBooking()
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('customer-tracking')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `user_id=eq.${profile?.id}`
      }, (payload) => {
        if (payload.new.status === 'in_progress' || payload.new.status === 'en_route') {
          fetchActiveBooking()
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [profile?.id])

  const fetchActiveBooking = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          workers(
            id,
            current_location_lat,
            current_location_lng,
            profiles(full_name, phone)
          )
        `)
        .eq('user_id', profile?.id)
        .in('status', ['assigned', 'en_route', 'in_progress'])
        .order('scheduled_date', { ascending: true })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setActiveBooking(data || null)
    } catch (error) {
      console.error('Error fetching active booking:', error)
      toast.error('Failed to load tracking information')
    } finally {
      setLoading(false)
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'Your cleaner has been assigned and will contact you soon.'
      case 'en_route':
        return 'Your cleaner is on their way to your location.'
      case 'in_progress':
        return 'Your cleaning service is currently in progress.'
      default:
        return 'Waiting for updates...'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'text-blue-600'
      case 'en_route': return 'text-purple-600'
      case 'in_progress': return 'text-green-600'
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

  if (!activeBooking) {
    return (
      <div className="text-center py-12">
        <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No active service</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have any services currently in progress.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-3 h-3 rounded-full ${
            activeBooking.status === 'in_progress' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'
          }`}></div>
          <h2 className={`text-lg font-semibold ${getStatusColor(activeBooking.status)}`}>
            {activeBooking.status.replace('_', ' ').toUpperCase()}
          </h2>
        </div>
        <p className="text-gray-600 mb-4">{getStatusMessage(activeBooking.status)}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ClockIcon className="h-4 w-4" />
            <span>Scheduled: {activeBooking.scheduled_time}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4" />
            <span>{activeBooking.address}</span>
          </div>
        </div>
      </div>

      {/* Worker Info */}
      {activeBooking.worker && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Cleaner</h3>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">
                {activeBooking.worker.profiles?.full_name || 'Professional Cleaner'}
              </h4>
              <p className="text-sm text-gray-500">
                {activeBooking.service_type.replace('_', ' ').toUpperCase()} Cleaning
              </p>
            </div>
            {activeBooking.worker.profiles?.phone && (
              <a
                href={`tel:${activeBooking.worker.profiles.phone}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PhoneIcon className="h-4 w-4 mr-2" />
                Call
              </a>
            )}
          </div>
        </div>
      )}

      {/* Map */}
      {activeBooking.worker?.current_location_lat && activeBooking.worker?.current_location_lng && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Location</h3>
          <div className="h-64 rounded-lg overflow-hidden">
            <MapContainer
              center={[activeBooking.worker.current_location_lng, activeBooking.worker.current_location_lat]}
              zoom={14}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Location updates every 30 seconds during service
          </p>
        </div>
      )}
    </div>
  )
}
