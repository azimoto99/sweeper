import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../contexts/AuthContext'
import { Subscription } from '../../types'
import { Button } from '../ui/Button'
import { LoadingIndicator } from '../layout/LoadingIndicator'
import { handleError, showSuccess, setLoading, isLoading } from '../../utils/errorHandler'
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  BanknotesIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  StarIcon,
  TrophyIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

interface SubscriptionWithUser extends Subscription {
  user: {
    id: string
    full_name: string
    email: string
  }
  created_at: string
}

interface SubscriptionStats {
  totalSubscriptions: number
  activeSubscriptions: number
  totalMRR: number
  tierDistribution: {
    silver: number
    gold: number
    platinum: number
  }
  recentSubscriptions: number
}

export function SubscriptionManagement() {
  const { profile } = useAuthContext()
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUser[]>([])
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<SubscriptionWithUser[]>([])
  const [stats, setStats] = useState<SubscriptionStats>({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalMRR: 0,
    tierDistribution: { silver: 0, gold: 0, platinum: 0 },
    recentSubscriptions: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled' | 'expired'>('all')
  const [tierFilter, setTierFilter] = useState<'all' | 'silver' | 'gold' | 'platinum'>('all')
  const loadingData = isLoading('subscriptions')

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  useEffect(() => {
    filterSubscriptions()
  }, [subscriptions, searchTerm, statusFilter, tierFilter])

  const fetchSubscriptions = async () => {
    try {
      setLoading('subscriptions', true, 'Loading subscriptions...')
      
      const { data: subscriptionsData, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          user:users!subscriptions_user_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setSubscriptions(subscriptionsData || [])
      calculateStats(subscriptionsData || [])
    } catch (error) {
      handleError(error, { action: 'fetch_subscriptions', userId: profile?.id })
    } finally {
      setLoading('subscriptions', false)
    }
  }

  const calculateStats = (subscriptionsData: SubscriptionWithUser[]) => {
    const totalSubscriptions = subscriptionsData.length
    const activeSubscriptions = subscriptionsData.filter(sub => sub.status === 'active').length
    
    // Calculate MRR based on subscription prices
    const priceMap = { silver: 29.99, gold: 49.99, platinum: 79.99 }
    const totalMRR = subscriptionsData
      .filter(sub => sub.status === 'active')
      .reduce((sum, sub) => sum + priceMap[sub.tier], 0)

    const tierDistribution = subscriptionsData.reduce((acc, sub) => {
      acc[sub.tier] = (acc[sub.tier] || 0) + 1
      return acc
    }, { silver: 0, gold: 0, platinum: 0 })

    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const recentSubscriptions = subscriptionsData.filter(
      sub => new Date(sub.created_at) >= lastMonth
    ).length

    setStats({
      totalSubscriptions,
      activeSubscriptions,
      totalMRR,
      tierDistribution,
      recentSubscriptions
    })
  }

  const filterSubscriptions = () => {
    let filtered = subscriptions

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter)
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(sub => sub.tier === tierFilter)
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sub =>
        sub.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredSubscriptions(filtered)
  }

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      setLoading('cancel_subscription', true, 'Cancelling subscription...')
      
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscriptionId)

      if (error) throw error

      showSuccess('Subscription cancelled successfully')
      await fetchSubscriptions()
    } catch (error) {
      handleError(error, { action: 'cancel_subscription', userId: profile?.id })
    } finally {
      setLoading('cancel_subscription', false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'expired':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'silver':
        return <StarIcon className="h-5 w-5 text-gray-500" />
      case 'gold':
        return <TrophyIcon className="h-5 w-5 text-yellow-500" />
      case 'platinum':
        return <ShieldCheckIcon className="h-5 w-5 text-purple-500" />
      default:
        return <StarIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loadingData) {
    return <LoadingIndicator fullScreen size="lg" text="Loading subscription data..." />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600">Monitor and manage customer subscriptions</p>
        </div>
        <Button
          onClick={fetchSubscriptions}
          variant="outline"
          className="flex items-center"
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSubscriptions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalMRR)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <ChartBarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentSubscriptions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Tier Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <StarIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="font-medium text-gray-900">Silver</span>
            </div>
            <span className="text-lg font-bold text-gray-900">{stats.tierDistribution.silver}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center">
              <TrophyIcon className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="font-medium text-gray-900">Gold</span>
            </div>
            <span className="text-lg font-bold text-gray-900">{stats.tierDistribution.gold}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 text-purple-500 mr-2" />
              <span className="font-medium text-gray-900">Platinum</span>
            </div>
            <span className="text-lg font-bold text-gray-900">{stats.tierDistribution.platinum}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Tiers</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Billing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.user.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {subscription.user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTierIcon(subscription.tier)}
                      <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                        {subscription.tier}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(subscription.status)}
                      <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                        {subscription.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(subscription.next_billing_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {subscription.discount_percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {subscription.status === 'active' && (
                      <Button
                        onClick={() => handleCancelSubscription(subscription.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}