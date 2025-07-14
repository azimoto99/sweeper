import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CalendarIcon, ClockIcon, MapPinIcon, StarIcon } from '@heroicons/react/24/outline'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface Booking {
  id: string
  service_type: string
  scheduled_date: string
  scheduled_time: string
  status: string
  total_amount: number
  address: string
  worker?: {
    full_name: string
  }
}

export function CustomerDashboard() {
  const { profile } = useAuthContext()
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    totalSpent: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch recent bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          worker:workers(full_name)
        `)
        .eq('customer_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (bookingsError) throw bookingsError

      setRecentBookings(bookings || [])

      // Calculate stats
      const { data: allBookings, error: statsError } = await supabase
        .from('bookings')
        .select('status, total_amount, scheduled_date')
        .eq('customer_id', profile?.id)

      if (statsError) throw statsError

      const now = new Date()
      const upcoming = allBookings?.filter(b => 
        new Date(b.scheduled_date) > now && b.status !== 'cancelled'
      ).length || 0
      
      const completed = allBookings?.filter(b => b.status === 'completed').length || 0
      const totalSpent = allBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0

      setStats({
        totalBookings: allBookings?.length || 0,
        upcomingBookings: upcoming,
        completedBookings: completed,
        totalSpent
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-purple-100 text-purple-800'
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
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your cleaning services
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Bookings</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.upcomingBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <StarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">$</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Spent</p>
              <p className="text-2xl font-semibold text-gray-900">${stats.totalSpent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/book"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CalendarIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Book a Service</p>
              <p className="text-sm text-gray-500">Schedule your next cleaning</p>
            </div>
          </Link>

          <Link
            to="/customer/bookings"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ClockIcon className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">View Bookings</p>
              <p className="text-sm text-gray-500">See all your appointments</p>
            </div>
          </Link>

          <Link
            to="/subscriptions"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <StarIcon className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Memberships</p>
              <p className="text-sm text-gray-500">Save with our plans</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentBookings.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No bookings yet</p>
              <Link
                to="/book"
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Book Your First Service
              </Link>
            </div>
          ) : (
            recentBookings.map((booking) => (
              <div key={booking.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {booking.service_type}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {new Date(booking.scheduled_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {booking.scheduled_time}
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {booking.address}
                      </div>
                    </div>
                    {booking.worker && (
                      <p className="mt-1 text-sm text-gray-500">
                        Worker: {booking.worker.full_name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${booking.total_amount}
                    </p>
                    {booking.status === 'in_progress' && (
                      <Link
                        to={`/customer/tracking/${booking.id}`}
                        className="mt-1 text-sm text-blue-600 hover:text-blue-500"
                      >
                        Track Service
                      </Link>
                    )}
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
