import React, { useState, useEffect } from 'react'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { AddressValidator } from './AddressValidator'

interface AddressInputProps {
  value: string
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void
  placeholder?: string
  className?: string
  required?: boolean
  showValidation?: boolean
}

export function AddressInput({ 
  value, 
  onChange, 
  onLocationSelect,
  placeholder = "Enter your address",
  className = "",
  required = false,
  showValidation = true
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validationCoordinates, setValidationCoordinates] = useState<{ lat: number; lng: number } | undefined>()

  // Simple address validation and geocoding
  const handleAddressChange = (address: string) => {
    onChange(address)
    
    if (address.length > 3) {
      // In a real implementation, you would use a geocoding service like:
      // - Google Places API
      // - Mapbox Geocoding API
      // - Here Geocoding API
      
      // For now, we'll just validate the format
      setLoading(true)
      setTimeout(() => {
        // Mock suggestions based on input
        const mockSuggestions = [
          {
            address: `${address}, McAllen, TX`,
            coordinates: { lat: 26.2034, lng: -98.2300 }
          },
          {
            address: `${address}, Edinburg, TX`,
            coordinates: { lat: 26.3017, lng: -98.1633 }
          }
        ].filter(s => s.address.toLowerCase().includes(address.toLowerCase()))
        
        setSuggestions(mockSuggestions)
        setShowSuggestions(mockSuggestions.length > 0)
        setLoading(false)
      }, 300)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (suggestion: any) => {
    onChange(suggestion.address, suggestion.coordinates)
    if (onLocationSelect) {
      onLocationSelect({
        lat: suggestion.coordinates.lat,
        lng: suggestion.coordinates.lng,
        address: suggestion.address
      })
    }
    setSuggestions([])
    setShowSuggestions(false)
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          
          // In a real implementation, you would reverse geocode these coordinates
          // For now, we'll use a placeholder
          const mockAddress = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
          onChange(mockAddress, { lat: latitude, lng: longitude })
          setLoading(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          setLoading(false)
        }
      )
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => handleAddressChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`block w-full pr-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${className}`}
        />
        <button
          type="button"
          onClick={getCurrentLocation}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          title="Use current location"
        >
          <MapPinIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => selectSuggestion(suggestion)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-md last:rounded-b-md"
            >
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">{suggestion.address}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Address validation */}
      {showValidation && (
        <AddressValidator
          address={value}
          onValidation={(isValid, isInServiceArea, coordinates) => {
            if (isValid && isInServiceArea && coordinates) {
              setValidationCoordinates(coordinates)
              onLocationSelect?.({
                lat: coordinates.lat,
                lng: coordinates.lng,
                address: value
              })
            } else {
              setValidationCoordinates(undefined)
            }
          }}
        />
      )}
    </div>
  )
}
