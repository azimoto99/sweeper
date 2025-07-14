import { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Booking, Worker } from '../../types'
import { AnalyticsSummary } from '../admin/AnalyticsSummary'
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export function Dashboard() {
  const { profile } = useAuthContext()
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    activeWorkers: 0,
    totalRevenue: 0
  })
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Redirect customers to dedicated customer dashboard
    if (profile?.role === 'customer') {
      window.location.href = '/customer'
      return
    }
    fetchDashboardData()
  }, [profile])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      if (profile?.role === 'admin') {
        // Admin dashboard
        const [bookingsRes, workersRes] = await Promise.all([
          supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(10),
          supabase.from('workers').select('*').eq('status', 'available')
        ])

        const bookings = bookingsRes.data || []
        const workers = workersRes.data || []

        setRecentBookings(bookings)
        setStats({
          totalBookings: bookings.length,
          completedBookings: bookings.filter(b => b.status === 'completed').length,
          activeWorkers: workers.length,
          totalRevenue: bookings.reduce((sum, b) => sum + b.price, 0)
        })
      } else if (profile?.role === 'worker') {
        // Worker dashboard - redirect to worker app
        window.location.href = '/worker'
        return
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Analytics Summary */}
      <div className="mb-8">
        <AnalyticsSummary />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={CalendarIcon}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={stats.completedBookings}
          icon={CheckCircleIcon}
          color="green"
        />
        <StatCard
          title="Active Workers"
          value={stats.activeWorkers}
          icon={UserGroupIcon}
          color="purple"
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon={CurrencyDollarIcon}
          color="yellow"
        />
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Bookings</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentBookings.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No bookings yet</p>
            </div>
          ) : (
            recentBookings.map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: {
  title: string
  value: string | number
  icon: any
  color: string
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500'
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 text-white p-1 rounded ${colorClasses[color as keyof typeof colorClasses]}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingRow({ booking }: { booking: Booking }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    en_route: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <MapPinIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {booking.service_type.replace('_', ' ').toUpperCase()} Cleaning
            </p>
            <p className="text-sm text-gray-500">{booking.address}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">${booking.price}</p>
            <p className="text-sm text-gray-500 flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              {booking.scheduled_date} at {booking.scheduled_time}
            </p>
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[booking.status]}`}>
            {booking.status.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  )
}
