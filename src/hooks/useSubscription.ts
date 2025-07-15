import { useState, useEffect } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Subscription } from '../types'
import { handleError } from '../utils/errorHandler'

export function useSubscription() {
  const { profile } = useAuthContext()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchSubscription()
    }
  }, [profile])

  const fetchSubscription = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') {
        handleError(error, { action: 'fetch_subscription', userId: profile.id })
      } else {
        setSubscription(data)
      }
    } catch (error) {
      handleError(error, { action: 'fetch_subscription', userId: profile.id })
    } finally {
      setLoading(false)
    }
  }

  const calculateDiscountedPrice = (originalPrice: number): {
    discountedPrice: number
    discountAmount: number
    discountPercentage: number
  } => {
    if (!subscription) {
      return {
        discountedPrice: originalPrice,
        discountAmount: 0,
        discountPercentage: 0
      }
    }

    const discountAmount = (originalPrice * subscription.discount_percentage) / 100
    const discountedPrice = originalPrice - discountAmount

    return {
      discountedPrice,
      discountAmount,
      discountPercentage: subscription.discount_percentage
    }
  }

  const getSubscriptionBenefits = (): string[] => {
    if (!subscription) return []

    const benefits = {
      silver: [
        '10% discount on all services',
        'Priority booking',
        'Monthly service reminders',
        'Basic customer support'
      ],
      gold: [
        '15% discount on all services',
        'Priority booking',
        'Bi-weekly service reminders',
        'Premium customer support',
        'Free add-on service monthly'
      ],
      platinum: [
        '20% discount on all services',
        'VIP priority booking',
        'Weekly service reminders',
        '24/7 premium support',
        'Free add-on service monthly',
        'Dedicated account manager',
        'Free emergency cleaning'
      ]
    }

    return benefits[subscription.tier] || []
  }

  const hasSubscription = (): boolean => {
    return subscription !== null && subscription.status === 'active'
  }

  const isSubscriptionTier = (tier: 'silver' | 'gold' | 'platinum'): boolean => {
    return subscription?.tier === tier
  }

  const getSubscriptionStatus = (): {
    isActive: boolean
    tier: string | null
    nextBillingDate: Date | null
    discountPercentage: number
  } => {
    if (!subscription) {
      return {
        isActive: false,
        tier: null,
        nextBillingDate: null,
        discountPercentage: 0
      }
    }

    return {
      isActive: subscription.status === 'active',
      tier: subscription.tier,
      nextBillingDate: new Date(subscription.next_billing_date),
      discountPercentage: subscription.discount_percentage
    }
  }

  return {
    subscription,
    loading,
    fetchSubscription,
    calculateDiscountedPrice,
    getSubscriptionBenefits,
    hasSubscription,
    isSubscriptionTier,
    getSubscriptionStatus
  }
}