import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { handleError, showSuccess, setLoading, isLoading } from '../../utils/errorHandler'
import { 
  BookingsByServiceChart, 
  RevenueOverTimeChart, 
  WorkerUtilizationChart, 
  BookingStatusChart 
} from './AnalyticsCharts'
import {
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  MapPinIcon,
  StarIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BanknotesIcon,
  UsersIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  totalRevenue: number
  totalBookings: number
  completedBookings: number
  activeWorkers: number
  averageRating: number
  revenueGrowth: number
  bookingGrowth: number
  workerUtilization: number
  customerSatisfaction: number
  averageJobDuration: number
  topServices: Array<{
    service_type: string
    count: number
    revenue: number
  }>
  revenueByMonth: Array<{
    month: string
    revenue: number
    bookings: number
  }>
  workerPerformance: Array<{
    worker_id: string
    worker_name: string
    completed_jobs: number
    total_revenue: number
    average_rating: number
    efficiency_score: number
  }>
  customerMetrics: {
    totalCustomers: number
    newCustomers: number
    returningCustomers: number
    churnRate: number
  }
}

const defaultAnalytics: AnalyticsData = {
  totalRevenue: 0,
  totalBookings: 0,
  completedBookings: 0,
  activeWorkers: 0,
  averageRating: 0,
  revenueGrowth: 0,
  bookingGrowth: 0,
  workerUtilization: 0,
  customerSatisfaction: 0,
  averageJobDuration: 0,
  topServices: [],
  revenueByMonth: [],
  workerPerformance: [],
  customerMetrics: {
    totalCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0,
    churnRate: 0
  }
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData>(defaultAnalytics)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'bookings' | 'workers'>('revenue')
  const loadingAnalytics = isLoading('analytics')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading('analytics', true, 'Loading analytics data...')
      
      const endDate = new Date()
      const startDate = new Date()
      
      // Calculate date range
      switch (dateRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(endDate.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }

      const [
        bookingsData,
        workersData,
        reviewsData,
        customersData
      ] = await Promise.all([
        fetchBookingAnalytics(startDate, endDate),
        fetchWorkerAnalytics(startDate, endDate),
        fetchReviewAnalytics(startDate, endDate),
        fetchCustomerAnalytics(startDate, endDate)
      ])

      // Calculate growth rates
      const previousPeriodStart = new Date(startDate)
      const previousPeriodEnd = new Date(startDate)
      const periodDuration = endDate.getTime() - startDate.getTime()
      previousPeriodStart.setTime(startDate.getTime() - periodDuration)
      
      const previousBookingsData = await fetchBookingAnalytics(previousPeriodStart, previousPeriodEnd)
      
      const revenueGrowth = calculateGrowthRate(
        bookingsData.totalRevenue,
        previousBookingsData.totalRevenue
      )
      
      const bookingGrowth = calculateGrowthRate(
        bookingsData.totalBookings,
        previousBookingsData.totalBookings
      )

      setAnalytics({
        ...bookingsData,
        ...workersData,
        ...reviewsData,
        ...customersData,
        revenueGrowth,
        bookingGrowth
      })
    } catch (error) {
      handleError(error, { action: 'fetch_analytics' })
    } finally {
      setLoading('analytics', false)
    }
  }

  const fetchBookingAnalytics = async (startDate: Date, endDate: Date) => {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (error) throw error

    const totalBookings = bookings?.length || 0
    const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0
    const totalRevenue = bookings?.reduce((sum, b) => sum + (b.price || 0), 0) || 0

    // Calculate average job duration (mock data for now)
    const averageJobDuration = 2.5 // hours

    // Top services
    const serviceCount = bookings?.reduce((acc, booking) => {
      const service = booking.service_type
      if (!acc[service]) {
        acc[service] = { count: 0, revenue: 0 }
      }
      acc[service].count += 1
      acc[service].revenue += booking.price || 0
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    const topServices = Object.entries(serviceCount || {})
      .map(([service_type, data]) => ({
        service_type,
        count: (data as { count: number; revenue: number })?.count || 0,
        revenue: (data as { count: number; revenue: number })?.revenue || 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Revenue by month
    const revenueByMonth = generateMonthlyRevenue(bookings || [], startDate, endDate)

    return {
      totalBookings,
      completedBookings,
      totalRevenue,
      averageJobDuration,
      topServices,
      revenueByMonth
    }
  }

  const fetchWorkerAnalytics = async (startDate: Date, endDate: Date) => {
    const { data: workers, error } = await supabase
      .from('workers')
      .select(`
        *,
        profiles!workers_profile_id_fkey(full_name)
      `)

    if (error) throw error

    const activeWorkers = workers?.filter(w => w.status !== 'offline').length || 0
    const workerUtilization = calculateWorkerUtilization(workers || [])

    // Worker performance
    const workerPerformance = await Promise.all(
      (workers || []).map(async (worker) => {
        const { data: workerBookings } = await supabase
          .from('bookings')
          .select('*')
          .eq('worker_id', worker.id)
          .eq('status', 'completed')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())

        const completed_jobs = workerBookings?.length || 0
        const total_revenue = workerBookings?.reduce((sum, b) => sum + (b.price || 0), 0) || 0
        
        // Mock rating data
        const average_rating = 4.2 + Math.random() * 0.8
        const efficiency_score = Math.min(100, (completed_jobs / 20) * 100)

        return {
          worker_id: worker.id,
          worker_name: (worker as any).profiles?.full_name || 'Unknown Worker',
          completed_jobs,
          total_revenue,
          average_rating,
          efficiency_score
        }
      })
    )

    return {
      activeWorkers,
      workerUtilization,
      workerPerformance: workerPerformance.sort((a, b) => b.total_revenue - a.total_revenue)
    }
  }

  const fetchReviewAnalytics = async (startDate: Date, endDate: Date) => {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (error) throw error

    const averageRating = reviews?.reduce((sum, r) => sum + r.rating, 0) / (reviews?.length || 1) || 0
    const customerSatisfaction = (averageRating / 5) * 100

    return {
      averageRating,
      customerSatisfaction
    }
  }

  const fetchCustomerAnalytics = async (startDate: Date, endDate: Date) => {
    const { data: customers, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')

    if (error) throw error

    const totalCustomers = customers?.length || 0
    const newCustomers = customers?.filter(c => 
      new Date(c.created_at) >= startDate && new Date(c.created_at) <= endDate
    ).length || 0
    
    const returningCustomers = totalCustomers - newCustomers
    const churnRate = Math.random() * 5 // Mock churn rate

    return {
      customerMetrics: {
        totalCustomers,
        newCustomers,
        returningCustomers,
        churnRate
      }
    }
  }

  const calculateGrowthRate = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const calculateWorkerUtilization = (workers: any[]): number => {
    if (workers.length === 0) return 0
    const busyWorkers = workers.filter(w => ['en_route', 'on_job'].includes(w.status)).length
    return (busyWorkers / workers.length) * 100
  }

  const generateMonthlyRevenue = (bookings: any[], startDate: Date, endDate: Date) => {
    const monthlyData: Record<string, { revenue: number; bookings: number }> = {}
    
    bookings.forEach(booking => {
      const date = new Date(booking.created_at)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, bookings: 0 }
      }
      
      monthlyData[monthKey].revenue += booking.price || 0
      monthlyData[monthKey].bookings += 1
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      bookings: data.bookings
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loadingAnalytics) {
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(analytics.totalRevenue)}
          change={analytics.revenueGrowth}
          icon={CurrencyDollarIcon}
          color="green"
        />
        <MetricCard
          title="Total Bookings"
          value={analytics.totalBookings.toString()}
          change={analytics.bookingGrowth}
          icon={CalendarIcon}
          color="blue"
        />
        <MetricCard
          title="Completion Rate"
          value={`${((analytics.completedBookings / analytics.totalBookings) * 100 || 0).toFixed(1)}%`}
          change={0}
          icon={CheckCircleIcon}
          color="purple"
        />
        <MetricCard
          title="Active Workers"
          value={analytics.activeWorkers.toString()}
          change={0}
          icon={UserGroupIcon}
          color="orange"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Average Rating"
          value={analytics.averageRating.toFixed(1)}
          change={0}
          icon={StarIcon}
          color="yellow"
        />
        <MetricCard
          title="Worker Utilization"
          value={`${analytics.workerUtilization.toFixed(1)}%`}
          change={0}
          icon={ClockIcon}
          color="indigo"
        />
        <MetricCard
          title="Customer Satisfaction"
          value={`${analytics.customerSatisfaction.toFixed(1)}%`}
          change={0}
          icon={UsersIcon}
          color="pink"
        />
        <MetricCard
          title="Avg Job Duration"
          value={`${analytics.averageJobDuration}h`}
          change={0}
          icon={ClockIcon}
          color="gray"
        />
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Over Time</h3>
          <div className="h-64">
            <RevenueChart data={analytics.revenueByMonth} />
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Services</h3>
          <div className="space-y-4">
            {analytics.topServices.map((service, index) => (
              <div key={service.service_type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-primary-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {service.service_type.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600">{service.count} bookings</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(service.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BookingsByServiceChart />
        <WorkerUtilizationChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueOverTimeChart />
        <BookingStatusChart />
      </div>

      {/* Worker Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Worker Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed Jobs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Efficiency
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.workerPerformance.map((worker) => (
                <tr key={worker.worker_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {worker.worker_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {worker.completed_jobs}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(worker.total_revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                      {worker.average_rating.toFixed(1)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, worker.efficiency_score)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {worker.efficiency_score.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Customers"
          value={analytics.customerMetrics.totalCustomers.toString()}
          change={0}
          icon={UsersIcon}
          color="blue"
        />
        <MetricCard
          title="New Customers"
          value={analytics.customerMetrics.newCustomers.toString()}
          change={0}
          icon={UserGroupIcon}
          color="green"
        />
        <MetricCard
          title="Returning Customers"
          value={analytics.customerMetrics.returningCustomers.toString()}
          change={0}
          icon={UsersIcon}
          color="purple"
        />
        <MetricCard
          title="Churn Rate"
          value={`${analytics.customerMetrics.churnRate.toFixed(1)}%`}
          change={0}
          icon={ArrowTrendingDownIcon}
          color="red"
        />
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  color
}: {
  title: string
  value: string
  change: number
  icon: any
  color: string
}) {
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    indigo: 'bg-indigo-500',
    pink: 'bg-pink-500',
    gray: 'bg-gray-500',
    red: 'bg-red-500'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {change !== 0 && (
          <div className={`flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? (
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
            )}
            <span className="text-sm font-medium">
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function RevenueChart({ data }: { data: Array<{ month: string; revenue: number; bookings: number }> }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue))
  
  return (
    <div className="h-full flex items-end justify-between space-x-2">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div
            className="w-full bg-primary-500 rounded-t-md min-h-[4px]"
            style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
          />
          <div className="mt-2 text-xs text-gray-600 text-center">
            <div className="font-medium">{item.month}</div>
            <div className="text-gray-500">{item.bookings} jobs</div>
          </div>
        </div>
      ))}
    </div>
  )
}