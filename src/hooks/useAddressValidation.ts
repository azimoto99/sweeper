import { useState, useCallback } from 'react'
import { geocodeAddress, isWithinServiceArea } from '../lib/mapbox'

interface AddressValidationResult {
  isValid: boolean
  isWithinServiceArea: boolean
  coordinates: [number, number] | null
  formattedAddress: string | null
  error: string | null
}

export function useAddressValidation() {
  const [isValidating, setIsValidating] = useState(false)
  
  const validateAddress = useCallback(async (address: string): Promise<AddressValidationResult> => {
    if (!address.trim()) {
      return {
        isValid: false,
        isWithinServiceArea: false,
        coordinates: null,
        formattedAddress: null,
        error: 'Address is required'
      }
    }

    setIsValidating(true)
    
    try {
      const result = await geocodeAddress(address)
      
      if (!result) {
        return {
          isValid: false,
          isWithinServiceArea: false,
          coordinates: null,
          formattedAddress: null,
          error: 'Address not found. Please check the address and try again.'
        }
      }

      const withinServiceArea = isWithinServiceArea(result.center)
      
      return {
        isValid: true,
        isWithinServiceArea: withinServiceArea,
        coordinates: result.center,
        formattedAddress: result.place_name,
        error: withinServiceArea ? null : 'This address is outside our service area (25 miles from Laredo, TX)'
      }
    } catch (error) {
      console.error('Address validation error:', error)
      return {
        isValid: false,
        isWithinServiceArea: false,
        coordinates: null,
        formattedAddress: null,
        error: 'Unable to validate address. Please check your connection and try again.'
      }
    } finally {
      setIsValidating(false)
    }
  }, [])

  const validateMultipleAddresses = useCallback(async (addresses: string[]): Promise<AddressValidationResult[]> => {
    setIsValidating(true)
    
    try {
      const results = await Promise.all(addresses.map(validateAddress))
      return results
    } finally {
      setIsValidating(false)
    }
  }, [validateAddress])

  return {
    validateAddress,
    validateMultipleAddresses,
    isValidating
  }
}