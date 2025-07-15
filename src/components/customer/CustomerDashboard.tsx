import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CalendarIcon, ClockIcon, MapPinIcon, StarIcon, SparklesIcon, CurrencyDollarIcon, ArrowRightIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'
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
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* Welcome Section */}
      <div className="relative overflow-hidden card-elevated p-8 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-2xl"></div>
        <div className="relative">
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-16 w-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
              <SparklesIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                Welcome back, {profile?.full_name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600 text-lg">
                Here's your cleaning dashboard overview
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group card-elevated p-6 hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Bookings</p>
              <p className="text-3xl font-bold gradient-text mt-2">{stats.totalBookings}</p>
            </div>
            <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <CalendarIcon className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-emerald-600 font-medium">
            <ChartBarIcon className="h-4 w-4 mr-1" />
            All time
          </div>
        </div>

        <div className="group card-elevated p-6 hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Upcoming</p>
              <p className="text-3xl font-bold gradient-text mt-2">{stats.upcomingBookings}</p>
            </div>
            <div className="h-14 w-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <ClockIcon className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-orange-600 font-medium">
            <CalendarIcon className="h-4 w-4 mr-1" />
            Next 30 days
          </div>
        </div>

        <div className="group card-elevated p-6 hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Completed</p>
              <p className="text-3xl font-bold gradient-text mt-2">{stats.completedBookings}</p>
            </div>
            <div className="h-14 w-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <StarIcon className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-emerald-600 font-medium">
            <StarIcon className="h-4 w-4 mr-1" />
            Successfully done
          </div>
        </div>

        <div className="group card-elevated p-6 hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Spent</p>
              <p className="text-3xl font-bold gradient-text mt-2">${stats.totalSpent}</p>
            </div>
            <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <CurrencyDollarIcon className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-purple-600 font-medium">
            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
            Lifetime value
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-elevated p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">Fast & Easy</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/booking"
            className="group relative overflow-hidden card-flat p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 hover:border-emerald-300"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Book a Service</h3>
              <p className="text-sm text-gray-500 mb-4">Schedule your next professional cleaning</p>
              <div className="flex items-center text-emerald-600 font-semibold text-sm group-hover:text-emerald-700 transition-colors duration-300">
                Get Started
                <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </Link>

          <Link
            to="/customer/bookings"
            className="group relative overflow-hidden card-flat p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 hover:border-orange-300"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">View Bookings</h3>
              <p className="text-sm text-gray-500 mb-4">See all your appointments and history</p>
              <div className="flex items-center text-orange-600 font-semibold text-sm group-hover:text-orange-700 transition-colors duration-300">
                View All
                <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </Link>

          <Link
            to="/subscriptions"
            className="group relative overflow-hidden card-flat p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 hover:border-purple-300"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <StarIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Memberships</h3>
              <p className="text-sm text-gray-500 mb-4">Save money with our subscription plans</p>
              <div className="flex items-center text-purple-600 font-semibold text-sm group-hover:text-purple-700 transition-colors duration-300">
                Explore Plans
                <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card-elevated">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Recent Bookings</h2>
            <Link to="/customer/bookings" className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm flex items-center transition-colors duration-300">
              View All
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {recentBookings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-24 w-24 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <CalendarIcon className="h-12 w-12 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-500 mb-6">Start your cleaning journey with your first service</p>
              <Link to="/booking">
                <Button
                  variant="primary"
                  size="lg"
                  glow
                >
                  Book Your First Service
                </Button>
              </Link>
            </div>
          ) : (
            recentBookings.map((booking) => (
              <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {booking.service_type}
                      </h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <CalendarIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium">{new Date(booking.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <ClockIcon className="h-4 w-4 text-orange-600" />
                        </div>
                        <span className="font-medium">{booking.scheduled_time}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <MapPinIcon className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="font-medium truncate">{booking.address}</span>
                      </div>
                    </div>
                    {booking.worker && (
                      <div className="mt-3 flex items-center">
                        <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-emerald-600 font-bold text-xs">{booking.worker.full_name.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Worker: {booking.worker.full_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-6">
                    <p className="text-2xl font-bold gradient-text mb-2">
                      ${booking.total_amount}
                    </p>
                    {booking.status === 'in_progress' && (
                      <Link to={`/customer/tracking/${booking.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Track Live
                        </Button>
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