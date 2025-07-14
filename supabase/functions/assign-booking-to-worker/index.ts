// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AssignmentRequest {
  booking_id: string
  worker_id: string
  estimated_arrival?: string
  notify_customer?: boolean
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

    const assignmentData: AssignmentRequest = await req.json()

    // Validate required fields
    if (!assignmentData.booking_id || !assignmentData.worker_id) {
      throw new Error('Missing required fields: booking_id, worker_id')
    }

    // Check if booking exists and is available for assignment
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select(`
        *,
        profiles!bookings_user_id_fkey (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('id', assignmentData.booking_id)
      .single()

    if (bookingError || !booking) {
      throw new Error('Booking not found')
    }

    if (booking.status !== 'pending') {
      throw new Error('Booking is not available for assignment')
    }

    // Check if worker exists and is available
    const { data: worker, error: workerError } = await supabaseClient
      .from('workers')
      .select(`
        *,
        profiles!workers_profile_id_fkey (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('id', assignmentData.worker_id)
      .single()

    if (workerError || !worker) {
      throw new Error('Worker not found')
    }

    if (worker.status === 'offline') {
      throw new Error('Worker is offline and cannot be assigned')
    }

    // Update booking status
    const { error: updateBookingError } = await supabaseClient
      .from('bookings')
      .update({
        worker_id: assignmentData.worker_id,
        status: 'assigned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentData.booking_id)

    if (updateBookingError) {
      throw new Error(`Failed to update booking: ${updateBookingError.message}`)
    }

    // Create assignment record
    const { data: assignment, error: assignmentError } = await supabaseClient
      .from('assignments')
      .insert({
        booking_id: assignmentData.booking_id,
        worker_id: assignmentData.worker_id,
        status: 'assigned',
        assigned_at: new Date().toISOString(),
        estimated_arrival: assignmentData.estimated_arrival,
      })
      .select()
      .single()

    if (assignmentError) {
      // Rollback booking update
      await supabaseClient
        .from('bookings')
        .update({
          worker_id: null,
          status: 'pending',
        })
        .eq('id', assignmentData.booking_id)
      
      throw new Error(`Failed to create assignment: ${assignmentError.message}`)
    }

    // Send notifications if requested
    if (assignmentData.notify_customer !== false) {
      await sendAssignmentNotifications(
        supabaseClient,
        booking,
        worker,
        assignment
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        assignment_id: assignment.id,
        booking_id: assignmentData.booking_id,
        worker_id: assignmentData.worker_id,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error assigning booking to worker:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

async function sendAssignmentNotifications(
  supabaseClient: any,
  booking: any,
  worker: any,
  assignment: any
) {
  const customer = booking.profiles
  const workerProfile = worker.profiles

  // Send email notification to customer
  if (customer?.email) {
    try {
      const notificationResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            type: 'email',
            to: customer.email,
            subject: 'Worker Assigned to Your Cleaning Service',
            template: 'worker_assigned',
            data: {
              customerName: customer.full_name,
              workerName: workerProfile?.full_name,
              workerPhone: workerProfile?.phone,
              serviceType: booking.service_type.replace('_', ' '),
              scheduledDate: booking.scheduled_date,
              scheduledTime: booking.scheduled_time,
              estimatedArrival: assignment.estimated_arrival,
            },
          }),
        }
      )

      if (!notificationResponse.ok) {
        console.error('Failed to send customer notification')
      }
    } catch (error) {
      console.error('Error sending customer notification:', error)
    }
  }

  // Send SMS notification to customer if phone number available
  if (customer?.phone) {
    try {
      const smsMessage = `Hi ${customer.full_name}! ${workerProfile?.full_name || 'A worker'} has been assigned to your ${booking.service_type.replace('_', ' ')} service on ${booking.scheduled_date}. They will contact you before arriving. - Margarita's Cleaning`

      const notificationResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            type: 'sms',
            to: customer.phone,
            message: smsMessage,
          }),
        }
      )

      if (!notificationResponse.ok) {
        console.error('Failed to send customer SMS')
      }
    } catch (error) {
      console.error('Error sending customer SMS:', error)
    }
  }

  // Send notification to worker (you could implement push notifications here)
  console.log(`Assignment notification sent for booking ${booking.id} to worker ${worker.id}`)
}