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

// Client-side PayPal API integration via backend proxy
const API_BASE = import.meta.env.VITE_APP_URL || 'http://localhost:5173'

// Create PayPal order via backend API
export const createPayPalOrder = async (amount: number, currency: string = 'USD', description: string): Promise<PayPalOrder> => {
  const response = await fetch(`${API_BASE}/api/paypal/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      description
    })
  })

  if (!response.ok) {
    throw new Error('Failed to create PayPal order')
  }

  return await response.json()
}

// Capture PayPal order via backend API
export const capturePayPalOrder = async (orderId: string): Promise<PayPalOrder> => {
  const response = await fetch(`${API_BASE}/api/paypal/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    throw new Error('Failed to capture PayPal order')
  }

  return await response.json()
}

// Create PayPal subscription via backend API
export const createPayPalSubscription = async (
  planId: string,
  subscriberName: string,
  subscriberEmail: string
): Promise<PayPalSubscription> => {
  const response = await fetch(`${API_BASE}/api/paypal/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planId,
      subscriberName,
      subscriberEmail
    })
  })

  if (!response.ok) {
    throw new Error('Failed to create PayPal subscription')
  }

  return await response.json()
}

// Cancel PayPal subscription via backend API
export const cancelPayPalSubscription = async (subscriptionId: string, reason: string = 'Customer request'): Promise<boolean> => {
  const response = await fetch(`${API_BASE}/api/paypal/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason })
  })

  return response.ok
}

// Get PayPal subscription via backend API
export const getPayPalSubscription = async (subscriptionId: string): Promise<PayPalSubscription | null> => {
  const response = await fetch(`${API_BASE}/api/paypal/subscriptions/${subscriptionId}`, {
    method: 'GET'
  })

  if (!response.ok) {
    return null
  }

  return await response.json()
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