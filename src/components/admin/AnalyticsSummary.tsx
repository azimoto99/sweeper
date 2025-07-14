import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  CurrencyDollarIcon,
  CalendarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

interface SummaryData {
  todayRevenue: number
  todayBookings: number
  activeWorkers: number
  completionRate: number
  weeklyGrowth: number
}

export function AnalyticsSummary() {
  const [summary, setSummary] = useState<SummaryData>({
    todayRevenue: 0,
    todayBookings: 0,
    activeWorkers: 0,
    completionRate: 0,
    weeklyGrowth: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

      // Fetch today's data
      const [bookingsRes, workersRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .gte('created_at', startOfDay.toISOString())
          .lt('created_at', endOfDay.toISOString()),
        supabase
          .from('workers')
          .select('*')
          .neq('status', 'offline')
      ])

      const todayBookings = bookingsRes.data?.length || 0
      const todayRevenue = bookingsRes.data?.reduce((sum, b) => sum + (b.price || 0), 0) || 0
      const activeWorkers = workersRes.data?.length || 0
      const completedToday = bookingsRes.data?.filter(b => b.status === 'completed').length || 0
      const completionRate = todayBookings > 0 ? (completedToday / todayBookings) * 100 : 0

      // Calculate weekly growth (mock for now)
      const weeklyGrowth = Math.random() * 20 - 10 // -10% to +10%

      setSummary({
        todayRevenue,
        todayBookings,
        activeWorkers,
        completionRate,
        weeklyGrowth
      })
    } catch (error) {
      console.error('Error fetching analytics summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white rounded-lg shadow p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-full">
            <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.todayRevenue)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-full">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
            <p className="text-lg font-bold text-gray-900">{summary.todayBookings}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-full">
            <UserGroupIcon className="h-5 w-5 text-purple-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Active Workers</p>
            <p className="text-lg font-bold text-gray-900">{summary.activeWorkers}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="p-2 bg-indigo-100 rounded-full">
            <ChartBarIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Completion Rate</p>
            <p className="text-lg font-bold text-gray-900">{summary.completionRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="p-2 bg-orange-100 rounded-full">
            <ArrowTrendingUpIcon className="h-5 w-5 text-orange-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Weekly Growth</p>
            <p className={`text-lg font-bold ${summary.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.weeklyGrowth >= 0 ? '+' : ''}{summary.weeklyGrowth.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}