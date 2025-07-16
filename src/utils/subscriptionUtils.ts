import { supabase } from '../lib/supabase'

export interface SubscriptionDiscount {
  tier: 'silver' | 'gold' | 'platinum' | null
  discountPercentage: number
  isActive: boolean
}

export async function getUserSubscriptionDiscount(userId: string): Promise<SubscriptionDiscount> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('tier, discount_percentage, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error || !data) {
      return {
        tier: null,
        discountPercentage: 0,
        isActive: false
      }
    }

    return {
      tier: data.tier,
      discountPercentage: data.discount_percentage,
      isActive: data.status === 'active'
    }
  } catch (error) {
    console.error('Error fetching subscription discount:', error)
    return {
      tier: null,
      discountPercentage: 0,
      isActive: false
    }
  }
}

export function applySubscriptionDiscount(originalPrice: number, discountPercentage: number): {
  originalPrice: number
  discountAmount: number
  finalPrice: number
  discountPercentage: number
} {
  const discountAmount = (originalPrice * discountPercentage) / 100
  const finalPrice = originalPrice - discountAmount

  return {
    originalPrice,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalPrice: Math.round(finalPrice * 100) / 100,
    discountPercentage
  }
}

export function getSubscriptionBenefits(tier: string | null): string[] {
  switch (tier) {
    case 'silver':
      return [
        '10% discount on all services',
        'Priority booking',
        'Monthly service reminder',
        'Basic customer support'
      ]
    case 'gold':
      return [
        '15% discount on all services',
        'Priority booking',
        'Bi-weekly service reminder',
        'Premium customer support',
        'Free add-on service monthly'
      ]
    case 'platinum':
      return [
        '20% discount on all services',
        'VIP priority booking',
        'Weekly service reminder',
        '24/7 premium support',
        'Free add-on service monthly',
        'Dedicated account manager',
        'Free emergency cleaning'
      ]
    default:
      return []
  }
}

export function getSubscriptionTierInfo(tier: string) {
  const tiers = {
    silver: {
      name: 'Silver',
      price: 29.99,
      discount: 10,
      color: 'gray'
    },
    gold: {
      name: 'Gold',
      price: 49.99,
      discount: 15,
      color: 'yellow'
    },
    platinum: {
      name: 'Platinum',
      price: 79.99,
      discount: 20,
      color: 'purple'
    }
  }

  return tiers[tier as keyof typeof tiers] || null
}