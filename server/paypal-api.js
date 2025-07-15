const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// PayPal configuration
const PAYPAL_CLIENT_ID = process.env.VITE_PAYPAL_CLIENT_ID
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api.paypal.com' 
  : 'https://api.sandbox.paypal.com'

// Get PayPal access token
const getAccessToken = async () => {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials not configured')
  }

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')}`
    },
    body: 'grant_type=client_credentials'
  })

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token')
  }

  const data = await response.json()
  return data.access_token
}

// Create PayPal order
app.post('/api/paypal/orders', async (req, res) => {
  try {
    const { amount, currency = 'USD', description } = req.body
    const accessToken = await getAccessToken()
    
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toFixed(2)
          },
          description: description
        }],
        application_context: {
          brand_name: "Margarita's Cleaning Services",
          landing_page: 'BILLING',
          user_action: 'PAY_NOW'
        }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create PayPal order')
    }

    const order = await response.json()
    res.json({
      id: order.id,
      status: order.status,
      amount,
      currency
    })
  } catch (error) {
    console.error('PayPal order creation error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Capture PayPal order
app.post('/api/paypal/orders/:orderId/capture', async (req, res) => {
  try {
    const { orderId } = req.params
    const accessToken = await getAccessToken()
    
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to capture PayPal order')
    }

    const order = await response.json()
    const amount = parseFloat(order.purchase_units[0].amount.value)
    
    res.json({
      id: order.id,
      status: order.status,
      amount,
      currency: order.purchase_units[0].amount.currency_code
    })
  } catch (error) {
    console.error('PayPal order capture error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create PayPal subscription
app.post('/api/paypal/subscriptions', async (req, res) => {
  try {
    const { planId, subscriberName, subscriberEmail } = req.body
    const accessToken = await getAccessToken()
    
    const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        plan_id: planId,
        subscriber: {
          name: {
            given_name: subscriberName.split(' ')[0],
            surname: subscriberName.split(' ').slice(1).join(' ')
          },
          email_address: subscriberEmail
        },
        application_context: {
          brand_name: "Margarita's Cleaning Services",
          user_action: 'SUBSCRIBE_NOW'
        }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create PayPal subscription')
    }

    const subscription = await response.json()
    res.json({
      id: subscription.id,
      status: subscription.status,
      plan_id: planId,
      subscriber: {
        name: subscriberName,
        email: subscriberEmail
      }
    })
  } catch (error) {
    console.error('PayPal subscription creation error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Cancel PayPal subscription
app.post('/api/paypal/subscriptions/:subscriptionId/cancel', async (req, res) => {
  try {
    const { subscriptionId } = req.params
    const { reason = 'Customer request' } = req.body
    const accessToken = await getAccessToken()
    
    const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ reason })
    })

    res.json({ success: response.ok })
  } catch (error) {
    console.error('PayPal subscription cancel error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get PayPal subscription
app.get('/api/paypal/subscriptions/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params
    const accessToken = await getAccessToken()
    
    const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    const subscription = await response.json()
    res.json({
      id: subscription.id,
      status: subscription.status,
      plan_id: subscription.plan_id,
      subscriber: {
        name: `${subscription.subscriber.name.given_name} ${subscription.subscriber.name.surname}`,
        email: subscription.subscriber.email_address
      }
    })
  } catch (error) {
    console.error('PayPal subscription get error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`PayPal API server running on port ${PORT}`)
})