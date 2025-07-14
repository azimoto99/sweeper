import React, { useState, useEffect } from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useAddressValidation } from '../../hooks/useAddressValidation'

export interface AddressValidationStatus {
  isValid: boolean
  isInServiceArea: boolean
  coordinates?: { lat: number; lng: number }
  error?: string
}

interface AddressValidatorProps {
  address: string
  onValidation: (isValid: boolean, isInServiceArea: boolean, coordinates?: { lat: number; lng: number }) => void
  className?: string
}

export function AddressValidator({ address, onValidation, className = "" }: AddressValidatorProps) {
  const { validateAddress, loading } = useAddressValidation()
  const [validationResult, setValidationResult] = useState<any>(null)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (address && address.length > 5) {
      const timeoutId = setTimeout(async () => {
        const result = await validateAddress(address)
        setValidationResult(result)
        setShowResult(true)
        onValidation(result.isValid, result.isInServiceArea, result.coordinates)
      }, 500) // Debounce validation

      return () => clearTimeout(timeoutId)
    } else {
      setShowResult(false)
      setValidationResult(null)
      onValidation(false, false)
    }
  }, [address])

  if (!showResult && !loading) {
    return null
  }

  return (
    <div className={`mt-2 ${className}`}>
      {loading && (
        <div className="flex items-center text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Validating address...
        </div>
      )}

      {validationResult && !loading && (
        <div className="space-y-2">
          {/* Address validity */}
          <div className="flex items-center text-sm">
            {validationResult.isValid ? (
              <>
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-green-700">Valid address format</span>
              </>
            ) : (
              <>
                <XCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-red-700">{validationResult.error}</span>
              </>
            )}
          </div>

          {/* Service area check */}
          {validationResult.isValid && (
            <div className="flex items-center text-sm">
              {validationResult.isInServiceArea ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-green-700">Within service area</span>
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-yellow-700">{validationResult.error}</span>
                </>
              )}
            </div>
          )}

          {/* Service area info */}
          {validationResult.isValid && validationResult.isInServiceArea && (
            <div className="text-xs text-gray-500">
              We provide service to this location
            </div>
          )}
        </div>
      )}
    </div>
  )
}
