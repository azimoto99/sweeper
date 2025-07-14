// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LocationUpdate {
  worker_id: string
  lat: number
  lng: number
  heading?: number
  speed?: number
  timestamp?: string
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

    const locationData: LocationUpdate = await req.json()
    const now = new Date().toISOString()

    // Validate required fields
    if (!locationData.worker_id || !locationData.lat || !locationData.lng) {
      throw new Error('Missing required fields: worker_id, lat, lng')
    }

    // Update worker's current location
    const { error: updateError } = await supabaseClient
      .from('workers')
      .update({
        current_location_lat: locationData.lat,
        current_location_lng: locationData.lng,
        last_location_update: now,
      })
      .eq('id', locationData.worker_id)

    if (updateError) {
      throw new Error(`Failed to update worker location: ${updateError.message}`)
    }

    // Insert location history
    const { error: insertError } = await supabaseClient
      .from('worker_locations')
      .insert({
        worker_id: locationData.worker_id,
        lat: locationData.lat,
        lng: locationData.lng,
        heading: locationData.heading,
        speed: locationData.speed,
        timestamp: locationData.timestamp || now,
      })

    if (insertError) {
      console.warn('Failed to insert location history:', insertError.message)
      // Don't fail the request if history insert fails
    }

    // Check if worker is assigned to any active bookings and notify customers
    const { data: assignments } = await supabaseClient
      .from('assignments')
      .select(`
        *,
        bookings!assignments_booking_id_fkey (
          id,
          user_id,
          status,
          profiles!bookings_user_id_fkey (
            email,
            full_name
          )
        )
      `)
      .eq('worker_id', locationData.worker_id)
      .in('status', ['assigned', 'en_route', 'arrived', 'in_progress'])

    // Send location updates to customers with active bookings
    if (assignments && assignments.length > 0) {
      for (const assignment of assignments) {
        const booking = assignment.bookings
        if (booking && booking.status === 'en_route') {
          // Calculate ETA if worker is en route
          const eta = await calculateETA(
            { lat: locationData.lat, lng: locationData.lng },
            { lat: booking.location_lat, lng: booking.location_lng }
          )

          // You could send a notification here about the updated ETA
          console.log(`Worker ${locationData.worker_id} ETA to booking ${booking.id}: ${eta} minutes`)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        location_updated: true,
        timestamp: now
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error updating worker location:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

async function calculateETA(
  workerLocation: { lat: number; lng: number },
  destinationLocation: { lat: number; lng: number }
): Promise<number> {
  // Simple distance calculation for ETA
  // In production, you'd use a routing service like Mapbox Directions API
  
  const toRadians = (degrees: number) => degrees * (Math.PI / 180)
  const earthRadiusMiles = 3959

  const dLat = toRadians(destinationLocation.lat - workerLocation.lat)
  const dLng = toRadians(destinationLocation.lng - workerLocation.lng)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(workerLocation.lat)) * Math.cos(toRadians(destinationLocation.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distanceMiles = earthRadiusMiles * c

  // Assume average speed of 25 mph in city
  const etaMinutes = Math.round((distanceMiles / 25) * 60)
  
  return etaMinutes
}