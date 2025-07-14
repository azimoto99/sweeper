// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify PayPal webhook signature
    const body = await req.text()
    const headers = Object.fromEntries(req.headers.entries())
    
    // PayPal webhook verification would go here
    // For now, we'll process the webhook without verification for demo purposes
    
    const webhookData = JSON.parse(body)
    console.log('PayPal webhook received:', webhookData)

    switch (webhookData.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCompleted(supabaseClient, webhookData)
        break
      case 'BILLING.SUBSCRIPTION.CREATED':
        await handleSubscriptionCreated(supabaseClient, webhookData)
        break
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(supabaseClient, webhookData)
        break
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handleSubscriptionPaymentFailed(supabaseClient, webhookData)
        break
      default:
        console.log('Unhandled webhook event type:', webhookData.event_type)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error processing PayPal webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

async function handlePaymentCompleted(supabaseClient: any, webhookData: any) {
  const paypalOrderId = webhookData.resource.supplementary_data?.related_ids?.order_id
  
  if (paypalOrderId) {
    // Update booking status
    const { error } = await supabaseClient
      .from('bookings')
      .update({
        status: 'pending', // Ready for assignment
        paypal_order_id: paypalOrderId
      })
      .eq('paypal_order_id', paypalOrderId)

    if (error) {
      console.error('Error updating booking after payment:', error)
    } else {
      console.log('Booking updated after payment completion')
    }
  }
}

async function handleSubscriptionCreated(supabaseClient: any, webhookData: any) {
  const subscriptionId = webhookData.resource.id
  const subscriberEmail = webhookData.resource.subscriber?.email_address
  
  if (subscriptionId && subscriberEmail) {
    // Find user by email and update subscription
    const { data: user } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', subscriberEmail)
      .single()

    if (user) {
      const { error } = await supabaseClient
        .from('subscriptions')
        .update({
          status: 'active',
          paypal_subscription_id: subscriptionId
        })
        .eq('user_id', user.id)
        .eq('status', 'pending')

      if (error) {
        console.error('Error updating subscription after creation:', error)
      } else {
        console.log('Subscription activated after PayPal creation')
      }
    }
  }
}

async function handleSubscriptionCancelled(supabaseClient: any, webhookData: any) {
  const subscriptionId = webhookData.resource.id
  
  const { error } = await supabaseClient
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('paypal_subscription_id', subscriptionId)

  if (error) {
    console.error('Error updating subscription after cancellation:', error)
  } else {
    console.log('Subscription cancelled after PayPal webhook')
  }
}

async function handleSubscriptionPaymentFailed(supabaseClient: any, webhookData: any) {
  const subscriptionId = webhookData.resource.id
  
  // You might want to pause the subscription or notify the user
  console.log('Subscription payment failed:', subscriptionId)
  
  // Could send notification to user about payment failure
}