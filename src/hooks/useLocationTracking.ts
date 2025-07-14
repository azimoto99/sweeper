import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useNotify } from './useNotify'

interface LocationData {
  latitude: number
  longitude: number
  heading?: number
  speed?: number
  accuracy?: number
  timestamp: string
}

interface UseLocationTrackingOptions {
  workerId?: string
  enabled?: boolean
  highAccuracy?: boolean
  maxAge?: number
  timeout?: number
  updateInterval?: number
}

export function useLocationTracking(options: UseLocationTrackingOptions = {}) {
  const {
    workerId,
    enabled = true,
    highAccuracy = true,
    maxAge = 30000,
    timeout = 10000,
    updateInterval = 30000
  } = options

  const [isTracking, setIsTracking] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null)
  const notify = useNotify()

  // Check geolocation permission
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state)
        result.onchange = () => setPermissionStatus(result.state)
      })
    }
  }, [])

  const updateLocation = useCallback(async (position: GeolocationPosition) => {
    if (!workerId) return

    try {
      const { latitude, longitude, heading, speed, accuracy } = position.coords
      const timestamp = new Date().toISOString()

      const locationData: LocationData = {
        latitude,
        longitude,
        heading: heading || undefined,
        speed: speed || undefined,
        accuracy: accuracy || undefined,
        timestamp
      }

      // Update current location in workers table
      const { error: workerError } = await supabase
        .from('workers')
        .update({
          current_location_lat: latitude,
          current_location_lng: longitude,
          last_location_update: timestamp
        })
        .eq('id', workerId)

      if (workerError) {
        throw new Error(`Failed to update worker location: ${workerError.message}`)
      }

      // Insert location history
      const { error: locationError } = await supabase
        .from('worker_locations')
        .insert({
          worker_id: workerId,
          lat: latitude,
          lng: longitude,
          heading: heading || null,
          speed: speed || null,
          timestamp
        })

      if (locationError) {
        console.warn('Failed to insert location history:', locationError)
      }

      setLastUpdate(new Date())
      setError(null)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Location update error:', err)
    }
  }, [workerId])

  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Location tracking error'
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user'
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable'
        break
      case error.TIMEOUT:
        errorMessage = 'Location request timed out'
        break
    }

    setError(errorMessage)
    console.error('Geolocation error:', error)

    // Only show notification for permission errors
    if (error.code === error.PERMISSION_DENIED) {
      notify.error('Location access denied. Please enable location services.')
    }
  }, [notify])

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      notify.error('Geolocation is not supported by this browser')
      return null
    }

    if (!workerId) {
      setError('Worker ID required')
      return null
    }

    setIsTracking(true)
    setError(null)

    const watchId = navigator.geolocation.watchPosition(
      updateLocation,
      handleLocationError,
      {
        enableHighAccuracy: highAccuracy,
        timeout: timeout,
        maximumAge: maxAge
      }
    )

    return watchId
  }, [workerId, highAccuracy, timeout, maxAge, updateLocation, handleLocationError, notify])

  const stopTracking = useCallback((watchId: number) => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
    }
    setIsTracking(false)
  }, [])

  // Auto-start/stop tracking based on enabled flag
  useEffect(() => {
    if (!enabled || !workerId) return

    const watchId = startTracking()
    
    return () => {
      if (watchId) {
        stopTracking(watchId)
      }
    }
  }, [enabled, workerId, startTracking, stopTracking])

  return {
    isTracking,
    lastUpdate,
    error,
    permissionStatus,
    startTracking,
    stopTracking
  }
}

// Hook for getting real-time location updates for all workers
export function useWorkerLocations() {
  const [locations, setLocations] = useState<Record<string, LocationData>>({})

  useEffect(() => {
    const subscription = supabase
      .channel('worker_locations_realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'worker_locations' 
      }, (payload) => {
        const locationData = payload.new as any
        setLocations(prev => ({
          ...prev,
          [locationData.worker_id]: {
            latitude: locationData.lat,
            longitude: locationData.lng,
            heading: locationData.heading,
            speed: locationData.speed,
            timestamp: locationData.timestamp
          }
        }))
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return locations
}