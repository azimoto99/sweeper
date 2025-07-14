import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

interface LocationData {
  lat: number
  lng: number
  timestamp: string
  accuracy?: number
  heading?: number
  speed?: number
}

interface LocationTrackingOptions {
  workerId?: string
  enabled?: boolean
  highAccuracy?: boolean
  updateInterval?: number
  maxAge?: number
}

export function useLocationTracking(options: LocationTrackingOptions = {}) {
  const { workerId, enabled = false, highAccuracy = true, updateInterval = 30000, maxAge = 30000 } = options
  
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')
  const watchIdRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (enabled && workerId) {
      startTracking()
    } else {
      stopTracking()
    }

    // Check permission status
    checkPermissionStatus()

    return () => {
      stopTracking()
    }
  }, [enabled, workerId])

  const checkPermissionStatus = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      setPermissionStatus(permission.state as any)
    } catch (error) {
      setPermissionStatus('unknown')
    }
  }

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    if (isTracking) return

    setIsTracking(true)
    setError(null)

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString(),
          accuracy: position.coords.accuracy,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined
        }
        setCurrentLocation(locationData)
        setLastUpdate(locationData.timestamp)
        updateLocationInDatabase(locationData)
      },
      (error) => {
        setError(`Error getting location: ${error.message}`)
        setIsTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )

    // Watch position changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString(),
          accuracy: position.coords.accuracy,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined
        }
        setCurrentLocation(locationData)
      },
      (error) => {
        console.error('Location tracking error:', error)
        setError(`Location tracking error: ${error.message}`)
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 30000
      }
    )

    // Update database every 30 seconds
    intervalRef.current = setInterval(() => {
      if (currentLocation) {
        updateLocationInDatabase(currentLocation)
      }
    }, 30000)
  }

  const stopTracking = () => {
    setIsTracking(false)
    
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const updateLocationInDatabase = async (locationData: LocationData) => {
    if (!workerId) return

    try {
      const { error } = await supabase
        .from('workers')
        .update({
          current_location_lat: locationData.lat,
          current_location_lng: locationData.lng,
          last_location_update: locationData.timestamp,
          updated_at: new Date().toISOString()
        })
        .eq('id', workerId)

      if (error) {
        console.error('Error updating location in database:', error)
      }

      // Also store in location history table if it exists
      try {
        await supabase
          .from('worker_locations')
          .insert({
            worker_id: workerId,
            lat: locationData.lat,
            lng: locationData.lng,
            timestamp: locationData.timestamp,
            accuracy: locationData.accuracy,
            heading: locationData.heading,
            speed: locationData.speed
          })
      } catch (historyError) {
        // Location history table might not exist, that's okay
        console.debug('Location history not stored:', historyError)
      }

    } catch (error) {
      console.error('Error updating worker location:', error)
    }
  }

  const requestLocationPermission = async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported')
      return false
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      
      if (permission.state === 'granted') {
        return true
      } else if (permission.state === 'prompt') {
        // Try to get location to trigger permission prompt
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 5000 }
          )
        })
      } else {
        setError('Location permission denied')
        return false
      }
    } catch (error) {
      console.error('Error checking location permission:', error)
      return false
    }
  }

  return {
    currentLocation,
    error,
    isTracking,
    lastUpdate,
    permissionStatus,
    startTracking,
    stopTracking,
    requestLocationPermission
  }
}
