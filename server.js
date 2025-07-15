import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com';

// Get PayPal access token
async function getPayPalAccessToken() {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Authorization': `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  return data.access_token;
}

// API Routes
app.post('/api/paypal/create-subscription', async (req, res) => {
  try {
    const { planId, userId, userEmail } = req.body;
    
    // Map plan IDs to PayPal plan IDs (these would be created in PayPal dashboard)
    const paypalPlanIds = {
      'silver': 'P-5ML4271244454362WXNWU5NQ',
      'gold': 'P-2UF78835G6983770WXNWU5NQ', 
      'platinum': 'P-3MT09893PW7045738WXNWU5NQ'
    };

    const accessToken = await getPayPalAccessToken();
    
    const subscriptionData = {
      plan_id: paypalPlanIds[planId],
      start_time: new Date().toISOString(),
      subscriber: {
        email_address: userEmail
      },
      application_context: {
        brand_name: 'Sweeper - Smart Cleaning Platform',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        },
        return_url: `${process.env.FRONTEND_URL}/subscriptions/success`,
        cancel_url: `${process.env.FRONTEND_URL}/subscriptions/cancel`
      }
    };

    const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `subscription-${userId}-${Date.now()}`
      },
      body: JSON.stringify(subscriptionData)
    });

    const subscription = await response.json();
    
    if (!response.ok) {
      throw new Error(subscription.message || 'Failed to create subscription');
    }

    const approvalUrl = subscription.links.find(link => link.rel === 'approve')?.href;
    
    res.json({
      subscriptionId: subscription.id,
      approvalUrl: approvalUrl
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/paypal/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        reason: 'User requested cancellation'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to cancel subscription');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/paypal/update-subscription', async (req, res) => {
  try {
    const { subscriptionId, newPlanId } = req.body;
    const accessToken = await getPayPalAccessToken();
    
    // Map plan IDs to PayPal plan IDs
    const paypalPlanIds = {
      'silver': 'P-5ML4271244454362WXNWU5NQ',
      'gold': 'P-2UF78835G6983770WXNWU5NQ',
      'platinum': 'P-3MT09893PW7045738WXNWU5NQ'
    };

    const updateData = {
      plan_id: paypalPlanIds[newPlanId]
    };

    const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/revise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update subscription');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/paypal/get-subscription-details', async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const subscription = await response.json();
    
    if (!response.ok) {
      throw new Error(subscription.message || 'Failed to get subscription details');
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error getting subscription details:', error);
    res.status(500).json({ message: error.message });
  }
});

// Handle client-side routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
