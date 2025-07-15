import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { LoadingIndicator } from '../layout/LoadingIndicator'
import { handleError, showSuccess } from '../../utils/errorHandler'
import { createNotification } from '../notifications/NotificationCenter'
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline'

export function SubscriptionSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile } = useAuthContext()
  const [processing, setProcessing] = useState(true)
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null)

  useEffect(() => {
    const subscriptionId = searchParams.get('subscription_id')
    if (subscriptionId && profile) {
      activateSubscription(subscriptionId)
    }
  }, [searchParams, profile])

  const activateSubscription = async (subscriptionId: string) => {
    try {
      // Get subscription details from PayPal
      const response = await fetch(`/api/paypal/get-subscription-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId })
      })

      if (!response.ok) {
        throw new Error('Failed to get subscription details')
      }

      const subscriptionData = await response.json()
      
      // Update subscription status in database
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('paypal_subscription_id', subscriptionId)
        .eq('user_id', profile!.id)

      if (error) throw error

      // Create success notification
      await createNotification(
        profile!.id,
        'Subscription Activated!',
        `Your subscription has been successfully activated. You're now saving money on all services!`,
        'success'
      )

      setSubscriptionDetails(subscriptionData)
      showSuccess('Subscription activated successfully!')
      
    } catch (error) {
      handleError(error, { action: 'activate_subscription', userId: profile?.id })
    } finally {
      setProcessing(false)
    }
  }

  if (processing) {
    return <LoadingIndicator fullScreen size="lg" text="Activating your subscription..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Subscription Activated!
          </h1>
          
          <div className="flex items-center justify-center mb-4">
            <SparklesIcon className="h-5 w-5 text-yellow-500 mr-2" />
            <p className="text-gray-600">
              You're now saving money on all services
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              Your subscription benefits are now active and will be automatically applied to all future bookings.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/subscriptions')}
              variant="primary"
              size="lg"
              fullWidth
            >
              View My Subscription
            </Button>
            
            <Button
              onClick={() => navigate('/book')}
              variant="outline"
              size="lg"
              fullWidth
            >
              Book Your First Service
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}