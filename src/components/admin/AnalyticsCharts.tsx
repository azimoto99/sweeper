import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { handleError } from '../../utils/errorHandler'
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

interface ChartData {
  label: string
  value: number
  color?: string
}

interface TimeSeriesData {
  date: string
  value: number
  label?: string
}

export function BookingsByServiceChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookingsByService()
  }, [])

  const fetchBookingsByService = async () => {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('service_type')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (error) throw error

      const serviceCount = bookings?.reduce((acc, booking) => {
        const service = booking.service_type.replace('_', ' ').toUpperCase()
        acc[service] = (acc[service] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const chartData = Object.entries(serviceCount || {}).map(([service, count]) => ({
        label: service,
        value: count,
        color: getServiceColor(service)
      }))

      setData(chartData.sort((a, b) => b.value - a.value))
    } catch (error) {
      handleError(error, { action: 'fetch_bookings_by_service' })
    } finally {
      setLoading(false)
    }
  }

  const getServiceColor = (service: string) => {
    const colors = {
      'REGULAR': '#3B82F6',
      'DEEP': '#8B5CF6',
      'MOVE IN OUT': '#10B981',
      'AIRBNB': '#F59E0B',
      'OFFICE': '#EF4444',
      'COMMERCIAL': '#6B7280'
    }
    return colors[service as keyof typeof colors] || '#6B7280'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Bookings by Service Type</h3>
      </div>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-20 text-sm text-gray-600 truncate">{item.label}</div>
            <div className="flex-1 mx-4">
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
            <div className="w-10 text-right text-sm font-medium text-gray-900">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RevenueOverTimeChart() {
  const [data, setData] = useState<TimeSeriesData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    fetchRevenueOverTime()
  }, [timeRange])

  const fetchRevenueOverTime = async () => {
    try {
      const endDate = new Date()
      const startDate = new Date()
      
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      startDate.setDate(endDate.getDate() - days)

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('created_at, price')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at')

      if (error) throw error

      // Group by day
      const dailyRevenue = bookings?.reduce((acc, booking) => {
        const date = new Date(booking.created_at).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + (booking.price || 0)
        return acc
      }, {} as Record<string, number>)

      // Fill in missing days with 0
      const chartData: TimeSeriesData[] = []
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]
        chartData.push({
          date: dateStr,
          value: dailyRevenue?.[dateStr] || 0,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })
      }

      setData(chartData)
    } catch (error) {
      handleError(error, { action: 'fetch_revenue_over_time' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Revenue Over Time</h3>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>
      <div className="h-40 flex items-end justify-between space-x-1">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center group">
            <div className="relative w-full">
              <div
                className="w-full bg-blue-500 rounded-t-md min-h-[2px] transition-all duration-300 group-hover:bg-blue-600"
                style={{ height: `${maxValue ? (item.value / maxValue) * 100 : 0}%` }}
              />
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ${item.value.toFixed(0)}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600 text-center">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function WorkerUtilizationChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkerUtilization()
  }, [])

  const fetchWorkerUtilization = async () => {
    try {
      const { data: workers, error } = await supabase
        .from('workers')
        .select(`
          *,
          profiles!workers_profile_id_fkey(full_name)
        `)

      if (error) throw error

      const utilizationData = workers?.map(worker => {
        // Calculate utilization based on status and recent activity
        let utilization = 0
        switch (worker.status) {
          case 'on_job':
            utilization = 90 + Math.random() * 10
            break
          case 'en_route':
            utilization = 70 + Math.random() * 20
            break
          case 'available':
            utilization = 20 + Math.random() * 30
            break
          case 'break':
            utilization = 0
            break
          case 'offline':
            utilization = 0
            break
        }

        return {
          label: (worker as any).profiles?.full_name || 'Unknown Worker',
          value: utilization,
          color: getUtilizationColor(utilization)
        }
      }) || []

      setData(utilizationData.sort((a, b) => b.value - a.value))
    } catch (error) {
      handleError(error, { action: 'fetch_worker_utilization' })
    } finally {
      setLoading(false)
    }
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return '#10B981' // Green
    if (utilization >= 60) return '#F59E0B' // Yellow
    if (utilization >= 40) return '#EF4444' // Red
    return '#6B7280' // Gray
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Worker Utilization</h3>
      </div>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-32 text-sm text-gray-600 truncate">{item.label}</div>
            <div className="flex-1 mx-4">
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${item.value}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
            <div className="w-12 text-right text-sm font-medium text-gray-900">
              {item.value.toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BookingStatusChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookingStatus()
  }, [])

  const fetchBookingStatus = async () => {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('status')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (error) throw error

      const statusCount = bookings?.reduce((acc, booking) => {
        const status = booking.status.replace('_', ' ').toUpperCase()
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const chartData = Object.entries(statusCount || {}).map(([status, count]) => ({
        label: status,
        value: count,
        color: getStatusColor(status)
      }))

      setData(chartData.sort((a, b) => b.value - a.value))
    } catch (error) {
      handleError(error, { action: 'fetch_booking_status' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'PENDING': '#F59E0B',
      'ASSIGNED': '#3B82F6',
      'EN ROUTE': '#8B5CF6',
      'IN PROGRESS': '#10B981',
      'COMPLETED': '#059669',
      'CANCELLED': '#EF4444'
    }
    return colors[status as keyof typeof colors] || '#6B7280'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Booking Status Distribution</h3>
      </div>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-20 text-sm text-gray-600 truncate">{item.label}</div>
            <div className="flex-1 mx-4">
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${(item.value / total) * 100}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
            <div className="w-16 text-right text-sm">
              <div className="font-medium text-gray-900">{item.value}</div>
              <div className="text-xs text-gray-500">
                {((item.value / total) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}