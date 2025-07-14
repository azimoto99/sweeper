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

  // Service area configuration from environment
  const SERVICE_AREA_LAT = parseFloat(import.meta.env.VITE_SERVICE_AREA_LAT || '26.2034')
  const SERVICE_AREA_LNG = parseFloat(import.meta.env.VITE_SERVICE_AREA_LNG || '-98.2300')
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

      // Mock geocoding - in reality you'd call Google Maps, Mapbox, etc.
      const mockCoordinates = {
        lat: SERVICE_AREA_LAT + (Math.random() - 0.5) * 0.5,
        lng: SERVICE_AREA_LNG + (Math.random() - 0.5) * 0.5
      }

      // Calculate distance from service area center
      const distance = calculateDistance(
        SERVICE_AREA_LAT,
        SERVICE_AREA_LNG,
        mockCoordinates.lat,
        mockCoordinates.lng
      )

      const isInServiceArea = distance <= SERVICE_RADIUS_MILES

      return {
        isValid: true,
        isInServiceArea,
        coordinates: mockCoordinates,
        formattedAddress: address,
        error: isInServiceArea ? undefined : `Address is outside our service area (${SERVICE_RADIUS_MILES} mile radius)`
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
