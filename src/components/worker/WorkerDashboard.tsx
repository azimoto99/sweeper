import React, { useState, useEffect } from 'react'
import { ClockIcon, MapPinIcon, CalendarIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Booking, Worker } from '../../types'
import toast from 'react-hot-toast'

interface BookingWithProfile extends Booking {
  profiles?: {
    full_name: string
    phone?: string
  }
}

export function WorkerDashboard() {
  const { profile } = useAuthContext()
  const [worker, setWorker] = useState<Worker | null>(null)
  const [todayBookings, setTodayBookings] = useState<BookingWithProfile[]>([])
  const [stats, setStats] = useState({
    todayJobs: 0,
    completedToday: 0,
    totalEarnings: 0,
    weeklyJobs: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkerData()
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('worker-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `worker_id=eq.${worker?.id}`
      }, () => {
        fetchWorkerData()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchWorkerData = async () => {
    try {
      // Get worker profile
      const { data: workerData, error: workerError } = await supabase
        .from('workers')
        .select('*')
        .eq('profile_id', profile?.id)
        .single()

      if (workerError) throw workerError
      setWorker(workerData)

      // Get today's bookings
      const today = new Date().toISOString().split('T')[0]
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles(full_name, phone)
        `)
        .eq('worker_id', workerData.id)
        .eq('scheduled_date', today)
        .order('scheduled_time')

      if (bookingsError) throw bookingsError
      setTodayBookings(bookingsData || [])

      // Calculate stats
      const completedToday = bookingsData?.filter(b => b.status === 'completed').length || 0
      const todayEarnings = bookingsData?.reduce((sum, b) => 
        b.status === 'completed' ? sum + (b.price * 0.7) : sum, 0) || 0 // Assuming 70% commission

      // Get weekly stats
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('bookings')
        .select('*')
        .eq('worker_id', workerData.id)
        .gte('scheduled_date', weekStart.toISOString().split('T')[0])

      const weeklyJobs = weeklyData?.length || 0

      setStats({
        todayJobs: bookingsData?.length || 0,
        completedToday,
        totalEarnings: todayEarnings,
        weeklyJobs
      })
    } catch (error) {
      console.error('Error fetching worker data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId)

      if (error) throw error
      
      toast.success(`Booking status updated to ${status.replace('_', ' ')}`)
      fetchWorkerData()
    } catch (error) {
      console.error('Error updating booking status:', error)
      toast.error('Failed to update booking status')
    }
  }

  const updateWorkerStatus = async (status: Worker['status']) => {
    if (!worker) return

    try {
      const { error } = await supabase
        .from('workers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', worker.id)

      if (error) throw error
      
      setWorker({ ...worker, status })
      toast.success(`Status updated to ${status}`)
    } catch (error) {
      console.error('Error updating worker status:', error)
      toast.error('Failed to update status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'en_route': return 'bg-blue-100 text-blue-800'
      case 'on_job': return 'bg-purple-100 text-purple-800'
      case 'break': return 'bg-yellow-100 text-yellow-800'
      case 'offline': return 'bg-gray-100 text-gray-800'
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
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {profile?.full_name}!
            </h1>
            <p className="text-gray-600 mt-2">
              Here's your schedule for today
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">Status:</span>
            <select
              value={worker?.status || 'offline'}
              onChange={(e) => updateWorkerStatus(e.target.value as Worker['status'])}
              className="rounded-md border-gray-300 text-sm"
            >
              <option value="available">Available</option>
              <option value="en_route">En Route</option>
              <option value="on_job">On Job</option>
              <option value="break">On Break</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Jobs</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.todayJobs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">$</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">${stats.totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Week</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.weeklyJobs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {todayBookings.length === 0 ? (
            <div className="p-6 text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs scheduled</h3>
              <p className="mt-1 text-sm text-gray-500">
                Enjoy your day off or check back later for new assignments.
              </p>
            </div>
          ) : (
            todayBookings.map((booking) => (
              <div key={booking.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {booking.service_type.replace('_', ' ').toUpperCase()} Cleaning
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {booking.scheduled_time}
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {booking.address}
                      </div>
                    </div>
                    {booking.profiles && (
                      <div className="mt-1 text-sm text-gray-500">
                        Customer: {booking.profiles.full_name}
                        {booking.profiles.phone && (
                          <a
                            href={`tel:${booking.profiles.phone}`}
                            className="ml-2 text-blue-600 hover:text-blue-500"
                          >
                            Call
                          </a>
                        )}
                      </div>
                    )}
                    {booking.notes && (
                      <div className="mt-1 text-sm text-gray-600">
                        <strong>Notes:</strong> {booking.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <span className="text-sm font-medium text-gray-900">
                      ${(booking.price * 0.7).toFixed(2)} {/* 70% commission */}
                    </span>
                    <div className="flex space-x-2">
                      {booking.status === 'assigned' && (
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'en_route')}
                          className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                        >
                          Start Trip
                        </button>
                      )}
                      {booking.status === 'en_route' && (
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'in_progress')}
                          className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200"
                        >
                          Start Job
                        </button>
                      )}
                      {booking.status === 'in_progress' && (
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'completed')}
                          className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
