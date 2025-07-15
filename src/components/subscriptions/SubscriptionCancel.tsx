import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { XCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export function SubscriptionCancel() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <XCircleIcon className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Subscription Cancelled
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your subscription setup was cancelled. You can try again anytime.
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              No charges were made to your account. You can return to our subscription plans and try again when you're ready.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/subscriptions')}
              variant="primary"
              size="lg"
              fullWidth
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Subscription Plans
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="lg"
              fullWidth
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}