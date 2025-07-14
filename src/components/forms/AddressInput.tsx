import { useState, useEffect, useRef } from 'react'
import { geocodeAddress, isWithinServiceArea } from '../../lib/mapbox'
import {
  MapPinIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface AddressResult {
  address: string
  coordinates: [number, number]
  place_name: string
  withinServiceArea: boolean
  confidence: number
}

interface AddressInputProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void
  placeholder?: string
  required?: boolean
  className?: string
  error?: string
}

export function AddressInput({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Enter service address",
  required = false,
  className = "",
  error
}: AddressInputProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<AddressResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedResult, setSelectedResult] = useState<AddressResult | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Debounced geocoding
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    if (value.length >= 3) {
      const timer = setTimeout(() => {
        searchAddresses(value)
      }, 300)
      setDebounceTimer(timer)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
      setSelectedResult(null)
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [value])

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchAddresses = async (query: string) => {
    if (!query.trim()) return

    setIsLoading(true)
    setValidationError(null)

    try {
      const result = await geocodeAddress(query)
      
      if (result) {
        const withinServiceArea = isWithinServiceArea(result.center)
        
        const addressResult: AddressResult = {
          address: result.place_name,
          coordinates: result.center,
          place_name: result.place_name,
          withinServiceArea,
          confidence: 0.8 // Simplified confidence score
        }

        setSuggestions([addressResult])
        setShowSuggestions(true)

        // Auto-select if exact match
        if (query.toLowerCase() === result.place_name.toLowerCase()) {
          setSelectedResult(addressResult)
          if (onLocationSelect) {
            onLocationSelect({
              lat: result.center[1],
              lng: result.center[0],
              address: result.place_name
            })
          }
        }
      } else {
        setSuggestions([])
        setValidationError('Address not found. Please try a different address.')
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      setValidationError('Unable to validate address. Please check your connection.')
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectSuggestion = (suggestion: AddressResult) => {
    onChange(suggestion.address)
    setSelectedResult(suggestion)
    setShowSuggestions(false)
    setValidationError(null)

    if (onLocationSelect) {
      onLocationSelect({
        lat: suggestion.coordinates[1],
        lng: suggestion.coordinates[0],
        address: suggestion.address
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // Clear selection if user types after selecting
    if (selectedResult && newValue !== selectedResult.address) {
      setSelectedResult(null)
    }
  }

  const clearInput = () => {
    onChange('')
    setSelectedResult(null)
    setSuggestions([])
    setShowSuggestions(false)
    setValidationError(null)
    inputRef.current?.focus()
  }

  const getValidationStatus = () => {
    if (!value) return null
    if (validationError) return 'error'
    if (selectedResult?.withinServiceArea) return 'success'
    if (selectedResult && !selectedResult.withinServiceArea) return 'warning'
    return null
  }

  const getStatusIcon = () => {
    const status = getValidationStatus()
    
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'warning':
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    if (validationError) return validationError
    if (selectedResult && !selectedResult.withinServiceArea) {
      return 'This address is outside our service area (25 miles from Laredo, TX)'
    }
    if (selectedResult?.withinServiceArea) {
      return 'Address verified and within service area'
    }
    return null
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : (
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          required={required}
          className={`block w-full pl-10 pr-12 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            error || validationError 
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
              : selectedResult?.withinServiceArea
              ? 'border-green-300 text-green-900 focus:ring-green-500 focus:border-green-500'
              : selectedResult && !selectedResult.withinServiceArea
              ? 'border-yellow-300 text-yellow-900 focus:ring-yellow-500 focus:border-yellow-500'
              : 'border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
        />

        <div className="absolute inset-y-0 right-0 flex items-center">
          {getStatusIcon()}
          
          {value && (
            <button
              type="button"
              onClick={clearInput}
              className="mr-2 p-1 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50"
            >
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {suggestion.address}
                  </div>
                  <div className="flex items-center mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      suggestion.withinServiceArea
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {suggestion.withinServiceArea ? 'In Service Area' : 'Outside Service Area'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status message */}
      {getStatusMessage() && (
        <div className={`mt-2 text-sm ${
          validationError 
            ? 'text-red-600' 
            : selectedResult?.withinServiceArea
            ? 'text-green-600'
            : 'text-yellow-600'
        }`}>
          {getStatusMessage()}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}