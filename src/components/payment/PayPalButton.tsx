import { useEffect, useRef, useState } from 'react'
import { PayPalButtonProps, loadPayPalScript } from '../../lib/paypal'

export function PayPalButton({ amount, description, onSuccess, onError, onCancel }: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initPayPal = async () => {
      try {
        const paypal = await loadPayPalScript()
        setIsLoaded(true)

        if (paypalRef.current) {
          paypal.Buttons({
            createOrder: (data: any, actions: any) => {
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    value: amount.toFixed(2),
                    currency_code: 'USD'
                  },
                  description: description
                }],
                application_context: {
                  brand_name: "Margarita's Cleaning Services",
                  landing_page: 'BILLING',
                  user_action: 'PAY_NOW'
                }
              })
            },
            onApprove: async (data: any, actions: any) => {
              try {
                const details = await actions.order.capture()
                onSuccess(data.orderID, details)
              } catch (error) {
                onError(error)
              }
            },
            onError: (error: any) => {
              onError(error)
            },
            onCancel: () => {
              if (onCancel) onCancel()
            },
            style: {
              layout: 'vertical',
              color: 'blue',
              shape: 'rect',
              label: 'paypal'
            }
          }).render(paypalRef.current)
        }
      } catch (error) {
        console.error('PayPal initialization error:', error)
        setError('PayPal is not available. Please try again later.')
      }
    }

    initPayPal()
  }, [amount, description, onSuccess, onError, onCancel])

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800 text-sm">{error}</p>
        <p className="text-red-600 text-xs mt-1">
          Please check your PayPal configuration and try again.
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
        <p className="text-gray-600 text-sm mt-2">Loading PayPal...</p>
      </div>
    )
  }

  return (
    <div>
      <div ref={paypalRef}></div>
    </div>
  )
}
