import { useEffect, useRef, useState } from 'react'
import { mapboxgl, mapboxConfig, createWorkerMarker, createBookingMarker, isWithinServiceArea, LAREDO_CENTER, getRoute, getOptimizedRoute } from '../../lib/mapbox'
import { Worker, Booking } from '../../types'

interface MapContainerProps {
  workers?: Worker[]
  bookings?: Booking[]
  center?: [number, number]
  zoom?: number
  className?: string
  onWorkerClick?: (worker: Worker) => void
  onBookingClick?: (booking: Booking) => void
  onWorkerDrop?: (worker: Worker, booking: Booking) => void
  selectedWorker?: Worker | null
  selectedBooking?: Booking | null
  showServiceArea?: boolean
  showTraffic?: boolean
  showRoutes?: boolean
  optimizeRoutes?: boolean
}

export function MapContainer({ 
  workers = [], 
  bookings = [], 
  center = [27.5306, -99.4803], 
  zoom = 12,
  className = "w-full h-96",
  onWorkerClick,
  onBookingClick,
  onWorkerDrop,
  selectedWorker,
  selectedBooking,
  showServiceArea = true,
  showTraffic = false,
  showRoutes = false,
  optimizeRoutes = false
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map.current) return

    try {
      map.current = new mapboxgl.Map({
        container: mapRef.current,
        style: mapboxConfig.style,
        center: [center[1], center[0]], // Mapbox uses [lng, lat]
        zoom: zoom,
        antialias: true,
      })

      map.current.on('load', () => {
        setMapLoaded(true)
        
        // Add service area circle if enabled
        if (showServiceArea && map.current) {
          addServiceAreaCircle()
        }
      })

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e)
        setMapError('Failed to load map. Please check your Mapbox token.')
      })

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    } catch (error) {
      console.error('Map initialization error:', error)
      setMapError('Failed to initialize map. Please check your Mapbox configuration.')
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Add service area circle
  const addServiceAreaCircle = () => {
    if (!map.current) return

    const serviceAreaGeoJSON = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: LAREDO_CENTER
        },
        properties: {
          radius: 25 * 1609.34 // 25 miles in meters
        }
      }]
    }

    // Add source
    map.current.addSource('service-area', {
      type: 'geojson',
      data: serviceAreaGeoJSON as any
    })

    // Add circle layer
    map.current.addLayer({
      id: 'service-area-circle',
      type: 'circle',
      source: 'service-area',
      paint: {
        'circle-radius': {
          stops: [
            [0, 0],
            [20, 400000]
          ],
          base: 2
        },
        'circle-color': '#3b82f6',
        'circle-opacity': 0.1,
        'circle-stroke-color': '#3b82f6',
        'circle-stroke-width': 2,
        'circle-stroke-opacity': 0.3
      }
    })
  }

  // Toggle traffic layer
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    if (showTraffic) {
      map.current.addLayer({
        id: 'traffic',
        type: 'line',
        source: {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-traffic-v1'
        },
        'source-layer': 'traffic',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'congestion'], 'low'], '#10b981',
            ['==', ['get', 'congestion'], 'moderate'], '#f59e0b',
            ['==', ['get', 'congestion'], 'heavy'], '#ef4444',
            ['==', ['get', 'congestion'], 'severe'], '#7c2d12',
            '#6b7280'
          ],
          'line-width': 2,
          'line-opacity': 0.8
        }
      })
    } else {
      if (map.current.getLayer('traffic')) {
        map.current.removeLayer('traffic')
      }
    }
  }, [showTraffic, mapLoaded])

  // Update map center and zoom
  useEffect(() => {
    if (!map.current) return
    map.current.flyTo({
      center: [center[1], center[0]], // Mapbox uses [lng, lat]
      zoom: zoom,
      duration: 1000
    })
  }, [center, zoom])

  // Update worker markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Remove existing worker markers
    Object.values(markersRef.current).forEach(marker => {
      if (marker.getElement().classList.contains('worker-marker')) {
        marker.remove()
      }
    })

    // Add new worker markers
    workers.forEach(worker => {
      if (worker.current_location) {
        const lng = worker.current_location.lng
        const lat = worker.current_location.lat
        
        // Validate location is within reasonable bounds
        if (isWithinServiceArea([lng, lat])) {
          const markerElement = createWorkerMarker(worker, onWorkerDrop)
          
          // Add click handler
          markerElement.addEventListener('click', () => {
            onWorkerClick?.(worker)
          })

          // Highlight selected worker
          if (selectedWorker?.id === worker.id) {
            markerElement.style.boxShadow = '0 0 0 4px #3b82f6, 0 2px 4px rgba(0,0,0,0.3)'
            markerElement.style.transform = 'scale(1.2)'
          }

          const marker = new mapboxgl.Marker(markerElement)
            .setLngLat([lng, lat])
            .addTo(map.current!)

          markersRef.current[`worker-${worker.id}`] = marker
        }
      }
    })
  }, [workers, mapLoaded, selectedWorker, onWorkerClick, onWorkerDrop])

  // Update booking markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Remove existing booking markers
    Object.values(markersRef.current).forEach(marker => {
      if (marker.getElement().classList.contains('booking-marker')) {
        marker.remove()
      }
    })

    // Add new booking markers
    bookings.forEach(booking => {
      if (booking.location_lat && booking.location_lng) {
        const lng = booking.location_lng
        const lat = booking.location_lat
        
        // Validate location is within reasonable bounds
        if (isWithinServiceArea([lng, lat])) {
          const markerElement = createBookingMarker(booking)
          
          // Add click handler
          markerElement.addEventListener('click', () => {
            onBookingClick?.(booking)
          })

          // Highlight selected booking
          if (selectedBooking?.id === booking.id) {
            markerElement.style.boxShadow = '0 0 0 3px #8b5cf6, 0 2px 4px rgba(0,0,0,0.3)'
            markerElement.style.transform = 'scale(1.2)'
          }

          const marker = new mapboxgl.Marker(markerElement)
            .setLngLat([lng, lat])
            .addTo(map.current!)

          markersRef.current[`booking-${booking.id}`] = marker
        }
      }
    })
  }, [bookings, mapLoaded, selectedBooking, onBookingClick])

  // Display routes for selected worker
  useEffect(() => {
    if (!map.current || !mapLoaded || !showRoutes || !selectedWorker) return

    const displayRoutes = async () => {
      // Get worker's assigned bookings
      const workerBookings = bookings.filter(b => b.worker_id === selectedWorker.id && b.status !== 'completed')
      
      if (workerBookings.length === 0 || !selectedWorker.current_location) return

      // Clear existing routes
      if (map.current!.getSource('route')) {
        map.current!.removeLayer('route')
        map.current!.removeSource('route')
      }

      try {
        const workerLocation: [number, number] = [
          selectedWorker.current_location.lng,
          selectedWorker.current_location.lat
        ]

        let routeData = null

        if (workerBookings.length === 1) {
          // Simple route to single booking
          const booking = workerBookings[0]
          if (booking.location_lat && booking.location_lng) {
            const bookingLocation: [number, number] = [booking.location_lng, booking.location_lat]
            routeData = await getRoute(workerLocation, bookingLocation)
          }
        } else if (workerBookings.length > 1) {
          // Multiple bookings - use optimization if enabled
          const waypoints = workerBookings
            .filter(b => b.location_lat && b.location_lng)
            .map(b => [b.location_lng, b.location_lat] as [number, number])
          
          if (waypoints.length > 0) {
            const allPoints = [workerLocation, ...waypoints]
            
            if (optimizeRoutes) {
              routeData = await getOptimizedRoute(allPoints)
            } else {
              // Simple route through all points in order
              routeData = await getRoute(workerLocation, waypoints[0])
            }
          }
        }

        if (routeData && routeData.route) {
          // Add route to map
          map.current!.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: routeData.route
            }
          })

          map.current!.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-opacity': 0.8
            }
          })
        }
      } catch (error) {
        console.error('Error displaying routes:', error)
      }
    }

    displayRoutes()
  }, [selectedWorker, bookings, mapLoaded, showRoutes, optimizeRoutes])

  // Error fallback
  if (mapError) {
    return (
      <div className={className}>
        <div className="w-full h-full bg-red-50 flex items-center justify-center rounded-lg border-2 border-red-200">
          <div className="text-center text-red-600">
            <div className="text-red-500 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-medium">Map Error</p>
            <p className="text-sm">{mapError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}
