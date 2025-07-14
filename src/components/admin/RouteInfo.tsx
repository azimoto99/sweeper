import { useState, useEffect } from 'react'
import { Worker, Booking } from '../../types'
import { getRoute, getOptimizedRoute, calculateDistance } from '../../lib/mapbox'
import {
  ClockIcon,
  MapPinIcon,
  ArrowRightIcon,
  CogIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface RouteInfoProps {
  worker: Worker
  bookings: Booking[]
  optimizeRoutes: boolean
  className?: string
}

interface RouteData {
  totalDistance: number
  totalDuration: number
  stops: {
    booking: Booking
    distance: number
    duration: number
    eta: string
  }[]
  optimized: boolean
}

export function RouteInfo({ worker, bookings, optimizeRoutes, className = '' }: RouteInfoProps) {
  const [routeData, setRouteData] = useState<RouteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get worker's assigned bookings
  const workerBookings = bookings.filter(b => 
    b.worker_id === worker.id && 
    b.status !== 'completed' && 
    b.status !== 'cancelled'
  )

  useEffect(() => {
    const calculateRoute = async () => {
      if (!worker.current_location || workerBookings.length === 0) {
        setRouteData(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const workerLocation: [number, number] = [
          worker.current_location.lng,
          worker.current_location.lat
        ]

        let totalDistance = 0
        let totalDuration = 0
        const stops: RouteData['stops'] = []

        if (workerBookings.length === 1) {
          // Single booking
          const booking = workerBookings[0]
          if (booking.location_lat && booking.location_lng) {
            const bookingLocation: [number, number] = [booking.location_lng, booking.location_lat]
            const route = await getRoute(workerLocation, bookingLocation)
            
            if (route) {
              totalDistance = route.distance
              totalDuration = route.duration
              
              const now = new Date()
              const eta = new Date(now.getTime() + route.duration * 1000)
              
              stops.push({
                booking,
                distance: route.distance,
                duration: route.duration,
                eta: eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              })
            }
          }
        } else {
          // Multiple bookings
          const waypoints = workerBookings
            .filter(b => b.location_lat && b.location_lng)
            .map(b => [b.location_lng, b.location_lat] as [number, number])
          
          if (waypoints.length > 0) {
            const allPoints = [workerLocation, ...waypoints]
            
            if (optimizeRoutes) {
              // Use optimized route
              const optimizedRoute = await getOptimizedRoute(allPoints)
              if (optimizedRoute) {
                totalDistance = optimizedRoute.distance
                totalDuration = optimizedRoute.duration
                
                // Calculate individual stop times based on optimization
                let cumulativeDuration = 0
                const now = new Date()
                
                workerBookings.forEach((booking, index) => {
                  if (booking.location_lat && booking.location_lng) {
                    const segmentDuration = totalDuration / workerBookings.length // Simplified
                    cumulativeDuration += segmentDuration
                    
                    const eta = new Date(now.getTime() + cumulativeDuration * 1000)
                    
                    stops.push({
                      booking,
                      distance: totalDistance / workerBookings.length, // Simplified
                      duration: segmentDuration,
                      eta: eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    })
                  }
                })
              }
            } else {
              // Sequential routes
              let currentLocation = workerLocation
              let cumulativeDuration = 0
              const now = new Date()
              
              for (const booking of workerBookings) {
                if (booking.location_lat && booking.location_lng) {
                  const bookingLocation: [number, number] = [booking.location_lng, booking.location_lat]
                  const route = await getRoute(currentLocation, bookingLocation)
                  
                  if (route) {
                    totalDistance += route.distance
                    cumulativeDuration += route.duration
                    
                    const eta = new Date(now.getTime() + cumulativeDuration * 1000)
                    
                    stops.push({
                      booking,
                      distance: route.distance,
                      duration: route.duration,
                      eta: eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    })
                    
                    currentLocation = bookingLocation
                  }
                }
              }
              
              totalDuration = cumulativeDuration
            }
          }
        }

        setRouteData({
          totalDistance,
          totalDuration,
          stops,
          optimized: optimizeRoutes && workerBookings.length > 1
        })

      } catch (err) {
        setError('Failed to calculate route')
        console.error('Route calculation error:', err)
      } finally {
        setLoading(false)
      }
    }

    calculateRoute()
  }, [worker, workerBookings, optimizeRoutes])

  const formatDistance = (meters: number): string => {
    const miles = meters * 0.000621371
    return `${miles.toFixed(1)} mi`
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${minutes}m`
  }

  if (workerBookings.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <MapPinIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No active bookings</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Route Information</h3>
          {routeData?.optimized && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CogIcon className="h-3 w-3 mr-1" />
              Optimized
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Calculating route...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {routeData && (
          <div className="space-y-4">
            {/* Route Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatDistance(routeData.totalDistance)}
                </div>
                <div className="text-sm text-gray-600">Total Distance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatDuration(routeData.totalDuration)}
                </div>
                <div className="text-sm text-gray-600">Total Time</div>
              </div>
            </div>

            {/* Stops */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Stops ({routeData.stops.length})</h4>
              {routeData.stops.map((stop, index) => (
                <div key={stop.booking.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {stop.booking.service_type.replace('_', ' ').toUpperCase()}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{formatDistance(stop.distance)}</span>
                        <span>•</span>
                        <span>{formatDuration(stop.duration)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{stop.booking.address}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      ETA: {stop.eta}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="pt-3 border-t border-gray-200">
              <button
                onClick={() => {
                  const addresses = routeData.stops.map(s => s.booking.address).join(' to ')
                  window.open(`https://maps.google.com/maps?q=${encodeURIComponent(addresses)}`, '_blank')
                }}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowRightIcon className="h-4 w-4 mr-2" />
                Open in Google Maps
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}