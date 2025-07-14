import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CalendarIcon, ClockIcon, MapPinIcon, EyeIcon } from '@heroicons/react/24/outline'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Booking } from '../../types'
import toast from 'react-hot-toast'

interface BookingWithWorker extends Booking {
  worker?: {
    profiles?: {
      full_name: string
    }
  }
}

export function BookingHistory() {
  const { profile } = useAuthContext()
  const [bookings, setBookings] = useState<BookingWithWorker[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all')

  useEffect(() => {
    fetchBookings()
  }, [filter])

  const fetchBookings = async () => {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          worker:workers(
            profiles(full_name)
          )
        `)
        .eq('user_id', profile?.id)
        .order('scheduled_date', { ascending: false })

      if (filter !== 'all') {
        if (filter === 'upcoming') {
          query = query.gte('scheduled_date', new Date().toISOString().split('T')[0])
            .neq('status', 'cancelled')
            .neq('status', 'completed')
        } else {
          query = query.eq('status', filter)
        }
      }

      const { data, error } = await query

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to load booking history')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'en_route': return 'bg-purple-100 text-purple-800'
      case 'in_progress': return 'bg-indigo-100 text-indigo-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Booking History</h1>
        <Link
          to="/book"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Book New Service
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All Bookings' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Bookings List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? 'You haven\'t made any bookings yet.' : `No ${filter} bookings found.`}
            </p>
            <div className="mt-6">
              <Link
                to="/book"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Book Your First Service
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {booking.service_type.replace('_', ' ').toUpperCase()} Cleaning
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        ${booking.price}
                      </span>
                      {booking.status === 'in_progress' && (
                        <Link
                          to={`/customer/tracking/${booking.id}`}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Track
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        {new Date(booking.scheduled_date).toLocaleDateString()}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        {booking.scheduled_time}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        {booking.address}
                      </div>
                    </div>
                  </div>
                  {booking.worker && (
                    <div className="mt-2 text-sm text-gray-500">
                      Worker: {booking.worker.profiles?.full_name || 'Assigned'}
                    </div>
                  )}
                  {booking.notes && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Notes:</strong> {booking.notes}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
