// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  type: 'email' | 'sms' | 'push'
  to: string
  subject?: string
  message: string
  template?: string
  data?: Record<string, any>
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

    const notificationData: NotificationRequest = await req.json()

    switch (notificationData.type) {
      case 'email':
        await sendEmail(notificationData)
        break
      case 'sms':
        await sendSMS(notificationData)
        break
      case 'push':
        await sendPushNotification(notificationData)
        break
      default:
        throw new Error(`Unsupported notification type: ${notificationData.type}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error sending notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

async function sendEmail(notification: NotificationRequest) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  
  if (!resendApiKey) {
    throw new Error('Resend API key not configured')
  }

  const emailData = {
    from: 'Margarita\'s Cleaning <noreply@margaritascleaning.com>',
    to: [notification.to],
    subject: notification.subject || 'Notification from Margarita\'s Cleaning',
    html: getEmailTemplate(notification.template, notification.data, notification.message),
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify(emailData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to send email: ${error.message}`)
  }

  console.log('Email sent successfully to:', notification.to)
}

async function sendSMS(notification: NotificationRequest) {
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    throw new Error('Twilio credentials not configured')
  }

  const smsData = new URLSearchParams({
    From: twilioPhoneNumber,
    To: notification.to,
    Body: notification.message,
  })

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
      },
      body: smsData,
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to send SMS: ${error.message}`)
  }

  console.log('SMS sent successfully to:', notification.to)
}

async function sendPushNotification(notification: NotificationRequest) {
  // Implement push notification logic here
  // Could use FCM, OneSignal, or other push notification services
  console.log('Push notification would be sent to:', notification.to)
  console.log('Message:', notification.message)
}

function getEmailTemplate(template: string | undefined, data: Record<string, any> | undefined, fallbackMessage: string): string {
  switch (template) {
    case 'booking_confirmation':
      return `
        <h2>Booking Confirmation</h2>
        <p>Dear ${data?.customerName || 'Customer'},</p>
        <p>Your cleaning service has been confirmed!</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3>Booking Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Service:</strong> ${data?.serviceType || 'N/A'}</li>
            <li><strong>Date:</strong> ${data?.scheduledDate || 'N/A'}</li>
            <li><strong>Time:</strong> ${data?.scheduledTime || 'N/A'}</li>
            <li><strong>Address:</strong> ${data?.address || 'N/A'}</li>
            <li><strong>Total:</strong> $${data?.price || 'N/A'}</li>
          </ul>
        </div>
        <p>We'll assign a worker and send you updates shortly.</p>
        <p>Best regards,<br>Margarita's Cleaning Services</p>
      `
    
    case 'worker_assigned':
      return `
        <h2>Worker Assigned to Your Cleaning</h2>
        <p>Dear ${data?.customerName || 'Customer'},</p>
        <p>Great news! We've assigned a worker to your cleaning service.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3>Worker Information:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Worker:</strong> ${data?.workerName || 'N/A'}</li>
            <li><strong>Phone:</strong> ${data?.workerPhone || 'N/A'}</li>
            <li><strong>Estimated Arrival:</strong> ${data?.estimatedArrival || 'N/A'}</li>
          </ul>
        </div>
        <p>Your worker will contact you shortly before arriving.</p>
        <p>Best regards,<br>Margarita's Cleaning Services</p>
      `

    case 'worker_en_route':
      return `
        <h2>Your Cleaner is On the Way!</h2>
        <p>Dear ${data?.customerName || 'Customer'},</p>
        <p>${data?.workerName || 'Your worker'} is now on their way to your location.</p>
        <p><strong>Estimated arrival time:</strong> ${data?.estimatedArrival || 'Soon'}</p>
        <p>Please ensure someone is available to provide access to your property.</p>
        <p>Best regards,<br>Margarita's Cleaning Services</p>
      `

    case 'service_completed':
      return `
        <h2>Service Completed!</h2>
        <p>Dear ${data?.customerName || 'Customer'},</p>
        <p>Your cleaning service has been completed successfully!</p>
        <p>We hope you're satisfied with the quality of our work. Please consider leaving us a review to help other customers.</p>
        <p><a href="${data?.reviewLink || '#'}" style="background: #3b82f6; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">Leave a Review</a></p>
        <p>Thank you for choosing Margarita's Cleaning Services!</p>
        <p>Best regards,<br>Margarita's Cleaning Services</p>
      `

    default:
      return `
        <h2>Notification from Margarita's Cleaning</h2>
        <p>${fallbackMessage}</p>
        <p>Best regards,<br>Margarita's Cleaning Services</p>
      `
  }
}