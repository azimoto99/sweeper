import { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Subscription } from '../../types'
import { CheckIcon, StarIcon } from '@heroicons/react/24/outline'

const SUBSCRIPTION_PLANS = [
  {
    id: 'silver',
    name: 'Silver',
    price: 29.99,
    discount: 10,
    features: [
      '10% discount on all services',
      'Priority booking',
      'Monthly service reminder',
      'Basic customer support'
    ]
  },
  {
    id: 'gold',
    name: 'Gold',
    price: 49.99,
    discount: 15,
    features: [
      '15% discount on all services',
      'Priority booking',
      'Bi-weekly service reminder',
      'Premium customer support',
      'Free add-on service monthly'
    ],
    popular: true
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: 79.99,
    discount: 20,
    features: [
      '20% discount on all services',
      'VIP priority booking',
      'Weekly service reminder',
      '24/7 premium support',
      'Free add-on service monthly',
      'Dedicated account manager',
      'Free emergency cleaning'
    ]
  }
]

export function SubscriptionsPage() {
  const { profile } = useAuthContext()
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCurrentSubscription()
  }, [profile])

  const fetchCurrentSubscription = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error)
      } else {
        setCurrentSubscription(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-600 mt-2">
          Save money with our membership plans and get priority access to our services
        </p>
      </div>

      {currentSubscription && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <CheckIcon className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-green-900">
                Active {currentSubscription.tier.toUpperCase()} Subscription
              </h3>
              <p className="text-green-700">
                You're saving {currentSubscription.discount_percentage}% on all services!
                Next billing: {new Date(currentSubscription.next_billing_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-lg shadow-lg overflow-hidden ${
              plan.popular ? 'ring-2 ring-primary-500' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-primary-500 text-white px-3 py-1 text-sm font-medium">
                Most Popular
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                {plan.popular && <StarIcon className="h-6 w-6 text-yellow-400 ml-2" />}
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-600">/month</span>
              </div>

              <div className="mb-6">
                <div className="text-lg font-semibold text-primary-600 mb-2">
                  {plan.discount}% OFF all services
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={currentSubscription?.tier === plan.id}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  currentSubscription?.tier === plan.id
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {currentSubscription?.tier === plan.id
                  ? 'Current Plan'
                  : 'Choose Plan'
                }
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Can I cancel my subscription anytime?</h3>
            <p className="text-gray-600">
              Yes, you can cancel your subscription at any time. Your benefits will continue until the end of your current billing period.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">How do discounts work?</h3>
            <p className="text-gray-600">
              Your subscription discount is automatically applied to all service bookings. The discount percentage depends on your plan tier.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Can I upgrade or downgrade my plan?</h3>
            <p className="text-gray-600">
              Yes, you can change your plan at any time. Changes will take effect on your next billing cycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
