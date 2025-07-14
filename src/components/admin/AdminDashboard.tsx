import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  CalendarIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface DashboardStats {
  totalBookings: number
  todayBookings: number
  activeWorkers: number
  totalWorkers: number
  todayRevenue: number
  monthlyRevenue: number
  completedBookings: number
  pendingBookings: number
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    todayBookings: 0,
    activeWorkers: 0,
    totalWorkers: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    completedBookings: 0,
    pendingBookings: 0
  })
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const monthStart = new Date()
      monthStart.setDate(1)
      const monthStartStr = monthStart.toISOString().split('T')[0]

      // Fetch all bookings
      const { data: allBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')

      if (bookingsError) throw bookingsError

      // Fetch workers
      const { data: workers, error: workersError } = await supabase
        .from('workers')
        .select('*')

      if (workersError) throw workersError

      // Fetch recent bookings with customer info
      const { data: recent, error: recentError } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles(full_name),
          workers(profiles(full_name))
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentError) throw recentError

      // Calculate stats
      const todayBookings = allBookings?.filter(b => b.scheduled_date === today) || []
      const monthlyBookings = allBookings?.filter(b => b.scheduled_date >= monthStartStr) || []
      const completedBookings = allBookings?.filter(b => b.status === 'completed') || []
      const pendingBookings = allBookings?.filter(b => b.status === 'pending') || []
      const activeWorkers = workers?.filter(w => w.status !== 'offline') || []

      const todayRevenue = todayBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.price || 0), 0)

      const monthlyRevenue = monthlyBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.price || 0), 0)

      setStats({
        totalBookings: allBookings?.length || 0,
        todayBookings: todayBookings.length,
        activeWorkers: activeWorkers.length,
        totalWorkers: workers?.length || 0,
        todayRevenue,
        monthlyRevenue,
        completedBookings: completedBookings.length,
        pendingBookings: pendingBookings.length
      })

      setRecentBookings(recent || [])
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
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of your cleaning service operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Bookings</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalBookings}</p>
              <p className="text-xs text-gray-500">Today: {stats.todayBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Workers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalWorkers}</p>
              <p className="text-xs text-gray-500">Active: {stats.activeWorkers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">${stats.monthlyRevenue}</p>
              <p className="text-xs text-gray-500">Today: ${stats.todayRevenue}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalBookings > 0 ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500">Pending: {stats.pendingBookings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/dispatch"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CalendarIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Dispatch Center</p>
              <p className="text-sm text-gray-500">Manage bookings & workers</p>
            </div>
          </Link>

          <Link
            to="/admin/workers"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserGroupIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Worker Management</p>
              <p className="text-sm text-gray-500">Add & manage workers</p>
            </div>
          </Link>

          <Link
            to="/admin/analytics"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChartBarIcon className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Analytics</p>
              <p className="text-sm text-gray-500">View detailed reports</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
          <Link
            to="/admin/bookings"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            View All
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {recentBookings.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No recent bookings</p>
            </div>
          ) : (
            recentBookings.map((booking) => (
              <div key={booking.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {booking.service_type.replace('_', ' ').toUpperCase()}
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
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Customer: {booking.profiles?.full_name}
                      {booking.workers?.profiles && (
                        <span className="ml-4">
                          Worker: {booking.workers.profiles.full_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${booking.price}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
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
