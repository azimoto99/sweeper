import { useState, useEffect } from 'react'
import { useAddressValidation } from '../../hooks/useAddressValidation'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

interface AddressValidatorProps {
  address: string
  onValidation?: (result: {
    isValid: boolean
    isWithinServiceArea: boolean
    coordinates: [number, number] | null
    formattedAddress: string | null
    error: string | null
  }) => void
  showDetails?: boolean
  className?: string
}

export function AddressValidator({ 
  address, 
  onValidation, 
  showDetails = true, 
  className = '' 
}: AddressValidatorProps) {
  const { validateAddress, isValidating } = useAddressValidation()
  const [validationResult, setValidationResult] = useState<any>(null)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    if (address.length >= 10) { // Only validate reasonably complete addresses
      const timer = setTimeout(async () => {
        const result = await validateAddress(address)
        setValidationResult(result)
        onValidation?.(result)
      }, 500)
      
      setDebounceTimer(timer)
    } else {
      setValidationResult(null)
      onValidation?.(null)
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [address, validateAddress, onValidation])

  if (!address || address.length < 10) {
    return null
  }

  if (isValidating) {
    return (
      <div className={`flex items-center text-sm text-gray-600 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
        Validating address...
      </div>
    )
  }

  if (!validationResult) {
    return null
  }

  const getIcon = () => {
    if (validationResult.isValid && validationResult.isWithinServiceArea) {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />
    }
    if (validationResult.isValid && !validationResult.isWithinServiceArea) {
      return <ExclamationCircleIcon className="h-4 w-4 text-yellow-500" />
    }
    return <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
  }

  const getTextColor = () => {
    if (validationResult.isValid && validationResult.isWithinServiceArea) {
      return 'text-green-600'
    }
    if (validationResult.isValid && !validationResult.isWithinServiceArea) {
      return 'text-yellow-600'
    }
    return 'text-red-600'
  }

  const getMessage = () => {
    if (validationResult.error) {
      return validationResult.error
    }
    if (validationResult.isValid && validationResult.isWithinServiceArea) {
      return 'Address verified and within service area'
    }
    if (validationResult.isValid && !validationResult.isWithinServiceArea) {
      return 'Address verified but outside service area'
    }
    return 'Address verification failed'
  }

  return (
    <div className={`flex items-start space-x-2 text-sm ${getTextColor()} ${className}`}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1">
        <p>{getMessage()}</p>
        {showDetails && validationResult.formattedAddress && (
          <p className="text-xs text-gray-500 mt-1">
            Formatted: {validationResult.formattedAddress}
          </p>
        )}
      </div>
    </div>
  )
}

// Simple validation status indicator
export function AddressValidationStatus({ 
  address, 
  className = '' 
}: { 
  address: string
  className?: string 
}) {
  const { validateAddress, isValidating } = useAddressValidation()
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isWithinServiceArea, setIsWithinServiceArea] = useState<boolean | null>(null)

  useEffect(() => {
    if (address.length >= 10) {
      validateAddress(address).then(result => {
        setIsValid(result.isValid)
        setIsWithinServiceArea(result.isWithinServiceArea)
      })
    } else {
      setIsValid(null)
      setIsWithinServiceArea(null)
    }
  }, [address, validateAddress])

  if (isValidating) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (isValid === null) {
    return null
  }

  if (isValid && isWithinServiceArea) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <CheckCircleIcon className="h-4 w-4 text-green-500" />
      </div>
    )
  }

  if (isValid && !isWithinServiceArea) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <ExclamationCircleIcon className="h-4 w-4 text-yellow-500" />
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
    </div>
  )
}