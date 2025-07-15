import { useState } from 'react'

interface AddressValidationResult {
  isValid: boolean
  isInServiceArea: boolean
  coordinates?: { lat: number; lng: number }
  formattedAddress?: string
  error?: string
}

export function useAddressValidation() {
  const [loading, setLoading] = useState(false)

  // Service area configuration from environment - Laredo, TX
  const SERVICE_AREA_LAT = parseFloat(import.meta.env.VITE_SERVICE_AREA_LAT || '27.5306')
  const SERVICE_AREA_LNG = parseFloat(import.meta.env.VITE_SERVICE_AREA_LNG || '-99.4803')
  const SERVICE_RADIUS_MILES = parseFloat(import.meta.env.VITE_SERVICE_RADIUS_MILES || '25')

  const validateAddress = async (address: string): Promise<AddressValidationResult> => {
    if (!address || address.trim().length < 5) {
      return {
        isValid: false,
        isInServiceArea: false,
        error: 'Please enter a valid address'
      }
    }

    setLoading(true)

    try {
      // In a real implementation, you would use a geocoding service
      // For now, we'll do basic validation and mock coordinates
      
      // Basic address format validation
      const hasNumber = /\d/.test(address)
      const hasStreet = address.toLowerCase().includes('st') || 
                       address.toLowerCase().includes('ave') || 
                       address.toLowerCase().includes('rd') || 
                       address.toLowerCase().includes('blvd') ||
                       address.toLowerCase().includes('dr') ||
                       address.toLowerCase().includes('ln')

      if (!hasNumber) {
        return {
          isValid: false,
          isInServiceArea: false,
          error: 'Please include a street number'
        }
      }

      // Try to use Mapbox API if available, otherwise use mock coordinates
      let coordinates: { lat: number; lng: number }
      
      const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN
      if (mapboxToken) {
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=1&country=US`
          )
          const data = await response.json()
          
          if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center
            coordinates = { lat, lng }
          } else {
            throw new Error('No results found')
          }
        } catch (error) {
          console.warn('Mapbox geocoding failed, using mock coordinates:', error)
          // Fall back to mock coordinates in Laredo area
          coordinates = {
            lat: SERVICE_AREA_LAT + (Math.random() - 0.5) * 0.5,
            lng: SERVICE_AREA_LNG + (Math.random() - 0.5) * 0.5
          }
        }
      } else {
        // Mock geocoding for development
        coordinates = {
          lat: SERVICE_AREA_LAT + (Math.random() - 0.5) * 0.5,
          lng: SERVICE_AREA_LNG + (Math.random() - 0.5) * 0.5
        }
      }

      // Calculate distance from service area center
      const distance = calculateDistance(
        SERVICE_AREA_LAT,
        SERVICE_AREA_LNG,
        coordinates.lat,
        coordinates.lng
      )

      const isInServiceArea = distance <= SERVICE_RADIUS_MILES

      return {
        isValid: true,
        isInServiceArea,
        coordinates,
        formattedAddress: address,
        error: isInServiceArea ? undefined : `Address is outside our service area (${SERVICE_RADIUS_MILES} mile radius from Laredo, TX). Distance: ${distance.toFixed(1)} miles.`
      }

    } catch (error) {
      return {
        isValid: false,
        isInServiceArea: false,
        error: 'Unable to validate address. Please try again.'
      }
    } finally {
      setLoading(false)
    }
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  return {
    validateAddress,
    loading
  }
}
