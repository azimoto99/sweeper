import { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Subscription } from '../../types'
import { Button } from '../ui/Button'
import { LoadingIndicator } from '../layout/LoadingIndicator'
import { handleError, showSuccess, setLoading, isLoading } from '../../utils/errorHandler'
import { createNotification } from '../notifications/NotificationCenter'
import { 
  CheckIcon, 
  StarIcon, 
  CreditCardIcon, 
  CalendarIcon, 
  ArrowPathIcon,
  XMarkIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

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
  const [showCancelModal, setShowCancelModal] = useState(false)
  const loadingSubscriptions = isLoading('subscriptions')
  const subscribing = isLoading('subscribe')
  const canceling = isLoading('cancel_subscription')
  const upgrading = isLoading('upgrade_subscription')

  useEffect(() => {
    fetchCurrentSubscription()
  }, [profile])

  const fetchCurrentSubscription = async () => {
    if (!profile) return

    try {
      setLoading('subscriptions', true, 'Loading subscription data...')
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') {
        handleError(error, { action: 'fetch_subscription', userId: profile.id })
      } else {
        setCurrentSubscription(data)
      }
    } catch (error) {
      handleError(error, { action: 'fetch_subscription', userId: profile.id })
    } finally {
      setLoading('subscriptions', false)
    }
  }

  const handleSubscribe = async (planId: string) => {
    if (!profile) return
    
    try {
      setLoading('subscribe', true, 'Setting up your subscription...')
      
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
      if (!plan) throw new Error('Invalid plan selected')

      // Create PayPal subscription
      const response = await fetch('http://localhost:3001/api/paypal/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: planId,
          subscriberName: profile.full_name,
          subscriberEmail: profile.email
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create subscription')
      }

      const subscriptionData = await response.json()

      // Save subscription to database
      const { error: dbError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: profile.id,
          tier: planId,
          paypal_subscription_id: subscriptionData.id,
          status: 'active',
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          discount_percentage: plan.discount
        })

      if (dbError) throw dbError

      // Create notification
      await createNotification(
        profile.id,
        'Subscription Activated',
        `Your ${plan.name} subscription has been activated. You're now saving ${plan.discount}% on all services!`,
        'success'
      )

      // Subscription created successfully
      showSuccess('Subscription created successfully!')
      await fetchCurrentSubscription()
      
    } catch (error) {
      handleError(error, { action: 'subscribe', userId: profile.id })
    } finally {
      setLoading('subscribe', false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!currentSubscription || !profile) return
    
    try {
      setLoading('cancel_subscription', true, 'Canceling subscription...')
      
      // Cancel PayPal subscription
      const response = await fetch(`http://localhost:3001/api/paypal/subscriptions/${currentSubscription.paypal_subscription_id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Customer request'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to cancel subscription')
      }

      // Update subscription status in database
      const { error: dbError } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', currentSubscription.id)

      if (dbError) throw dbError

      // Create notification
      await createNotification(
        profile.id,
        'Subscription Cancelled',
        'Your subscription has been cancelled. You will continue to have access until the end of your current billing period.',
        'info'
      )

      setCurrentSubscription(null)
      setShowCancelModal(false)
      showSuccess('Subscription cancelled successfully')
      
    } catch (error) {
      handleError(error, { action: 'cancel_subscription', userId: profile.id })
    } finally {
      setLoading('cancel_subscription', false)
    }
  }

  const handleUpgradeSubscription = async (newPlanId: string) => {
    if (!currentSubscription || !profile) return
    
    try {
      setLoading('upgrade_subscription', true, 'Upgrading subscription...')
      
      const newPlan = SUBSCRIPTION_PLANS.find(p => p.id === newPlanId)
      if (!newPlan) throw new Error('Invalid plan selected')

      // Update PayPal subscription
      const response = await fetch(`http://localhost:3001/api/paypal/subscriptions/${currentSubscription.paypal_subscription_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: currentSubscription.paypal_subscription_id,
          newPlanId: newPlanId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update subscription')
      }

      // Update subscription in database
      const { error: dbError } = await supabase
        .from('subscriptions')
        .update({ 
          tier: newPlanId,
          discount_percentage: newPlan.discount
        })
        .eq('id', currentSubscription.id)

      if (dbError) throw dbError

      // Create notification
      await createNotification(
        profile.id,
        'Subscription Updated',
        `Your subscription has been upgraded to ${newPlan.name}. You're now saving ${newPlan.discount}% on all services!`,
        'success'
      )

      await fetchCurrentSubscription()
      showSuccess('Subscription upgraded successfully')
      
    } catch (error) {
      handleError(error, { action: 'upgrade_subscription', userId: profile.id })
    } finally {
      setLoading('upgrade_subscription', false)
    }
  }

  if (loadingSubscriptions) {
    return <LoadingIndicator fullScreen size="lg" text="Loading subscription data..." />
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
        <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full mr-4">
                <ShieldCheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-green-900 flex items-center">
                  Active {currentSubscription.tier.toUpperCase()} Subscription
                  <SparklesIcon className="h-5 w-5 text-yellow-500 ml-2" />
                </h3>
                <p className="text-green-700">
                  You're saving {currentSubscription.discount_percentage}% on all services!
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Next billing: {new Date(currentSubscription.next_billing_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowCancelModal(true)}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancel
            </Button>
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

              <Button
                onClick={() => currentSubscription ? handleUpgradeSubscription(plan.id) : handleSubscribe(plan.id)}
                disabled={currentSubscription?.tier === plan.id}
                loading={subscribing || upgrading}
                loadingText={currentSubscription ? 'Upgrading...' : 'Setting up...'}
                variant={plan.popular ? 'primary' : 'outline'}
                size="lg"
                fullWidth
                className={currentSubscription?.tier === plan.id ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
              >
                <CreditCardIcon className="h-5 w-5 mr-2" />
                {currentSubscription?.tier === plan.id
                  ? 'Current Plan'
                  : currentSubscription
                  ? 'Upgrade'
                  : 'Choose Plan'
                }
              </Button>
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

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <XMarkIcon className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Cancel Subscription</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You will continue to have access to your benefits until the end of your current billing period.
            </p>
            <div className="flex space-x-4">
              <Button
                onClick={() => setShowCancelModal(false)}
                variant="outline"
                fullWidth
              >
                Keep Subscription
              </Button>
              <Button
                onClick={handleCancelSubscription}
                loading={canceling}
                loadingText="Canceling..."
                variant="primary"
                fullWidth
                className="bg-red-600 hover:bg-red-700"
              >
                Cancel Subscription
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Additional Benefits Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheckIcon className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Guaranteed Savings</h3>
          <p className="text-gray-600">
            Save money on every service with automatic discount application
          </p>
        </div>
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Priority Booking</h3>
          <p className="text-gray-600">
            Get first access to booking slots and preferred time slots
          </p>
        </div>
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <SparklesIcon className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Premium Support</h3>
          <p className="text-gray-600">
            Get dedicated customer support and faster response times
          </p>
        </div>
      </div>
    </div>
  )
}
