import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

if (!MAPBOX_ACCESS_TOKEN) {
  throw new Error('Missing Mapbox access token. Please set VITE_MAPBOX_ACCESS_TOKEN in your .env file.')
}

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

export { mapboxgl }

export const LAREDO_CENTER: [number, number] = [-99.4803, 27.5306]
export const DEFAULT_ZOOM = 11

export const mapboxConfig = {
  style: 'mapbox://styles/mapbox/streets-v12',
  center: LAREDO_CENTER,
  zoom: DEFAULT_ZOOM,
  antialias: true,
}

// Custom map style for the business
export const customMapStyle = {
  version: 8,
  name: 'Sweeper Custom',
  sources: {
    'mapbox-streets': {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#f8fafc',
      },
    },
    {
      id: 'landuse',
      source: 'mapbox-streets',
      'source-layer': 'landuse',
      type: 'fill',
      paint: {
        'fill-color': '#e2e8f0',
        'fill-opacity': 0.5,
      },
    },
    {
      id: 'water',
      source: 'mapbox-streets',
      'source-layer': 'water',
      type: 'fill',
      paint: {
        'fill-color': '#0ea5e9',
        'fill-opacity': 0.8,
      },
    },
    {
      id: 'roads',
      source: 'mapbox-streets',
      'source-layer': 'road',
      type: 'line',
      paint: {
        'line-color': '#ffffff',
        'line-width': 2,
      },
    },
    {
      id: 'buildings',
      source: 'mapbox-streets',
      'source-layer': 'building',
      type: 'fill',
      paint: {
        'fill-color': '#e5e7eb',
        'fill-opacity': 0.6,
      },
    },
  ],
}

// Geocoding service
export const geocodeAddress = async (address: string): Promise<{
  center: [number, number]
  place_name: string
} | null> => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=US&proximity=${LAREDO_CENTER[0]},${LAREDO_CENTER[1]}`
    )
    
    const data = await response.json()
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      return {
        center: feature.center,
        place_name: feature.place_name,
      }
    }
    
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

// Reverse geocoding
export const reverseGeocode = async (lng: number, lat: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}`
    )
    
    const data = await response.json()
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name
    }
    
    return null
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

// Calculate route between two points
export const getRoute = async (
  start: [number, number],
  end: [number, number],
  profile: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<{
  route: any
  duration: number
  distance: number
} | null> => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`
    )
    
    const data = await response.json()
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      return {
        route: route.geometry,
        duration: route.duration,
        distance: route.distance,
      }
    }
    
    return null
  } catch (error) {
    console.error('Routing error:', error)
    return null
  }
}

// Calculate optimal route for multiple waypoints
export const getOptimizedRoute = async (
  waypoints: [number, number][],
  profile: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<{
  route: any
  duration: number
  distance: number
  waypoint_order: number[]
} | null> => {
  try {
    const coordinates = waypoints.map(point => `${point[0]},${point[1]}`).join(';')
    
    const response = await fetch(
      `https://api.mapbox.com/optimized-trips/v1/mapbox/${profile}/${coordinates}?steps=true&geometries=geojson&source=first&destination=last&access_token=${MAPBOX_ACCESS_TOKEN}`
    )
    
    const data = await response.json()
    
    if (data.trips && data.trips.length > 0) {
      const trip = data.trips[0]
      return {
        route: trip.geometry,
        duration: trip.duration,
        distance: trip.distance,
        waypoint_order: data.waypoints.map((wp: any) => wp.waypoint_index),
      }
    }
    
    return null
  } catch (error) {
    console.error('Optimization error:', error)
    return null
  }
}

// Check if point is within service area
export const isWithinServiceArea = (
  point: [number, number],
  center: [number, number] = LAREDO_CENTER,
  radiusMiles: number = 25
): boolean => {
  const toRadians = (degrees: number) => degrees * (Math.PI / 180)
  const earthRadiusMiles = 3959

  const dLat = toRadians(point[1] - center[1])
  const dLng = toRadians(point[0] - center[0])
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(center[1])) * Math.cos(toRadians(point[1])) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = earthRadiusMiles * c

  return distance <= radiusMiles
}

// Calculate distance between two points
export const calculateDistance = (
  point1: [number, number],
  point2: [number, number]
): number => {
  const toRadians = (degrees: number) => degrees * (Math.PI / 180)
  const earthRadiusMiles = 3959

  const dLat = toRadians(point2[1] - point1[1])
  const dLng = toRadians(point2[0] - point1[0])
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1[1])) * Math.cos(toRadians(point2[1])) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusMiles * c
}

// Worker status colors for map markers
export const workerStatusColors = {
  available: '#10b981', // green
  en_route: '#f59e0b', // yellow
  on_job: '#3b82f6', // blue
  break: '#f97316', // orange
  offline: '#6b7280', // gray
}

// Booking status colors for map markers
export const bookingStatusColors = {
  pending: '#6b7280', // gray
  assigned: '#f59e0b', // yellow
  en_route: '#3b82f6', // blue
  in_progress: '#8b5cf6', // purple
  completed: '#10b981', // green
  cancelled: '#ef4444', // red
}

// Create worker marker element
export const createWorkerMarker = (worker: any, onDrop?: (worker: any, booking: any) => void) => {
  const el = document.createElement('div')
  el.className = 'worker-marker'
  el.style.width = '40px'
  el.style.height = '40px'
  el.style.borderRadius = '50%'
  el.style.backgroundColor = workerStatusColors[worker.status as keyof typeof workerStatusColors]
  el.style.border = '3px solid white'
  el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
  el.style.cursor = 'pointer'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.style.fontSize = '16px'
  el.style.color = 'white'
  el.style.fontWeight = 'bold'
  el.innerHTML = worker.full_name?.[0]?.toUpperCase() || worker.profile?.full_name?.[0]?.toUpperCase() || 'W'
  
  // Add drop zone functionality
  if (onDrop) {
    el.addEventListener('dragover', (e) => {
      e.preventDefault()
      el.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.5)'
      el.style.transform = 'scale(1.1)'
    })
    
    el.addEventListener('dragleave', () => {
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
      el.style.transform = 'scale(1)'
    })
    
    el.addEventListener('drop', (e) => {
      e.preventDefault()
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
      el.style.transform = 'scale(1)'
      
      const bookingData = e.dataTransfer?.getData('application/json')
      if (bookingData) {
        const booking = JSON.parse(bookingData)
        onDrop(worker, booking)
      }
    })
  }
  
  return el
}

// Create booking marker element
export const createBookingMarker = (booking: any) => {
  const el = document.createElement('div')
  el.className = 'booking-marker'
  el.style.width = '30px'
  el.style.height = '30px'
  el.style.borderRadius = '50%'
  el.style.backgroundColor = bookingStatusColors[booking.status as keyof typeof bookingStatusColors]
  el.style.border = '2px solid white'
  el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
  el.style.cursor = 'pointer'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.style.fontSize = '12px'
  el.style.color = 'white'
  el.style.fontWeight = 'bold'
  el.innerHTML = booking.service_type[0].toUpperCase()
  return el
}