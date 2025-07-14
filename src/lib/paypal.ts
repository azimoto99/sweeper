// Simplified PayPal integration for MVP
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID

if (!PAYPAL_CLIENT_ID) {
  console.warn('Missing PayPal Client ID. PayPal features will be disabled.')
}

export interface PayPalOrder {
  id: string
  status: string
  amount: number
  currency: string
}

export interface PayPalSubscription {
  id: string
  status: string
  plan_id: string
  subscriber: {
    name: string
    email: string
  }
}

// Mock functions for MVP - replace with actual PayPal SDK integration later
export const createPayPalOrder = async (amount: number, currency: string = 'USD', description: string): Promise<PayPalOrder> => {
  // Mock implementation for MVP
  return {
    id: `mock_order_${Date.now()}`,
    status: 'CREATED',
    amount,
    currency,
  }
}

export const capturePayPalOrder = async (orderId: string): Promise<PayPalOrder> => {
  // Mock implementation for MVP
  return {
    id: orderId,
    status: 'COMPLETED',
    amount: 100,
    currency: 'USD',
  }
}

export const createPayPalSubscription = async (
  planId: string,
  subscriberName: string,
  subscriberEmail: string
): Promise<PayPalSubscription> => {
  // Mock implementation for MVP
  return {
    id: `mock_sub_${Date.now()}`,
    status: 'ACTIVE',
    plan_id: planId,
    subscriber: {
      name: subscriberName,
      email: subscriberEmail,
    },
  }
}

export const cancelPayPalSubscription = async (subscriptionId: string, reason: string = 'Customer request'): Promise<boolean> => {
  // Mock implementation for MVP
  return true
}

export const getPayPalSubscription = async (subscriptionId: string): Promise<PayPalSubscription | null> => {
  // Mock implementation for MVP
  return null
}

// Client-side PayPal script loader
export const loadPayPalScript = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve(window.paypal)
      return
    }

    if (!PAYPAL_CLIENT_ID) {
      reject(new Error('PayPal Client ID not configured'))
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`
    script.async = true
    script.onload = () => {
      if (window.paypal) {
        resolve(window.paypal)
      } else {
        reject(new Error('PayPal SDK failed to load'))
      }
    }
    script.onerror = () => reject(new Error('PayPal SDK failed to load'))
    
    document.head.appendChild(script)
  })
}

// PayPal button component props
export interface PayPalButtonProps {
  amount: number
  currency?: string
  description: string
  onSuccess: (orderId: string, details: any) => void
  onError: (error: any) => void
  onCancel?: () => void
}

// Types for PayPal SDK
declare global {
  interface Window {
    paypal?: any
  }
}