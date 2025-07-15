import React, { useState, useEffect } from 'react'
import { ExclamationCircleIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'textarea' | 'select' | 'checkbox'
  value: string | boolean
  onChange: (value: string | boolean) => void
  onBlur?: () => void
  error?: string
  success?: string
  hint?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: { value: string; label: string }[]
  rows?: number
  maxLength?: number
  pattern?: string
  autoComplete?: string
  className?: string
  validateOnChange?: boolean
  customValidator?: (value: string) => string | null
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  success,
  hint,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  rows = 3,
  maxLength,
  pattern,
  autoComplete,
  className = '',
  validateOnChange = false,
  customValidator
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [internalError, setInternalError] = useState<string | null>(null)
  const [hasBeenBlurred, setHasBeenBlurred] = useState(false)

  // Real-time validation
  useEffect(() => {
    if (validateOnChange && hasBeenBlurred && typeof value === 'string') {
      validateField(value)
    }
  }, [value, validateOnChange, hasBeenBlurred])

  const validateField = (fieldValue: string) => {
    if (customValidator) {
      const validationError = customValidator(fieldValue)
      setInternalError(validationError)
      return validationError
    }

    // Built-in validation
    if (required && !fieldValue.trim()) {
      setInternalError(`${label} is required`)
      return `${label} is required`
    }

    if (type === 'email' && fieldValue) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(fieldValue)) {
        setInternalError('Please enter a valid email address')
        return 'Please enter a valid email address'
      }
    }

    if (type === 'tel' && fieldValue) {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/
      if (!phoneRegex.test(fieldValue)) {
        setInternalError('Please enter a valid phone number')
        return 'Please enter a valid phone number'
      }
    }

    if (pattern && fieldValue) {
      const regex = new RegExp(pattern)
      if (!regex.test(fieldValue)) {
        setInternalError('Please enter a valid format')
        return 'Please enter a valid format'
      }
    }

    setInternalError(null)
    return null
  }

  const handleBlur = () => {
    setIsFocused(false)
    setHasBeenBlurred(true)
    if (typeof value === 'string') {
      validateField(value)
    }
    onBlur?.()
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const displayError = error || internalError
  const hasError = Boolean(displayError)
  const hasSuccess = Boolean(success && !hasError)

  const baseInputClasses = `
    block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset 
    placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6
    transition-colors duration-200
    ${hasError 
      ? 'ring-red-300 focus:ring-red-500' 
      : hasSuccess 
        ? 'ring-green-300 focus:ring-green-500'
        : isFocused
          ? 'ring-blue-500'
          : 'ring-gray-300 focus:ring-blue-500'
    }
    ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
  `

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            maxLength={maxLength}
            className={baseInputClasses}
            autoComplete={autoComplete}
          />
        )

      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            required={required}
            disabled={disabled}
            className={baseInputClasses}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              id={name}
              name={name}
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => onChange(e.target.checked)}
              onBlur={handleBlur}
              onFocus={handleFocus}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={name} className="ml-2 block text-sm text-gray-900">
              {label}
            </label>
          </div>
        )

      case 'password':
        return (
          <div className="relative">
            <input
              id={name}
              name={name}
              type={showPassword ? 'text' : 'password'}
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
              onBlur={handleBlur}
              onFocus={handleFocus}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              maxLength={maxLength}
              pattern={pattern}
              className={`${baseInputClasses} pr-10`}
              autoComplete={autoComplete}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-4 w-4 text-gray-400" />
              ) : (
                <EyeIcon className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        )

      default:
        return (
          <input
            id={name}
            name={name}
            type={type}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            maxLength={maxLength}
            pattern={pattern}
            className={baseInputClasses}
            autoComplete={autoComplete}
          />
        )
    }
  }

  if (type === 'checkbox') {
    return (
      <div className={`space-y-1 ${className}`}>
        {renderInput()}
        {displayError && (
          <div className="flex items-center space-x-1 text-red-600 text-sm">
            <ExclamationCircleIcon className="h-4 w-4" />
            <span>{displayError}</span>
          </div>
        )}
        {hint && !displayError && (
          <p className="text-gray-500 text-sm">{hint}</p>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {renderInput()}
        
        {/* Status icons */}
        {(hasError || hasSuccess) && type !== 'password' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {hasError ? (
              <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
      </div>

      {/* Character count */}
      {maxLength && typeof value === 'string' && (
        <div className="text-right text-xs text-gray-500">
          {value.length}/{maxLength}
        </div>
      )}

      {/* Error message */}
      {displayError && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <ExclamationCircleIcon className="h-4 w-4" />
          <span>{displayError}</span>
        </div>
      )}

      {/* Success message */}
      {hasSuccess && (
        <div className="flex items-center space-x-1 text-green-600 text-sm">
          <CheckCircleIcon className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Hint */}
      {hint && !displayError && !hasSuccess && (
        <p className="text-gray-500 text-sm">{hint}</p>
      )}
    </div>
  )
}
