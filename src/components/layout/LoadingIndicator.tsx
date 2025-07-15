import React from 'react'

interface LoadingIndicatorProps {
  type?: 'spinner' | 'skeleton' | 'dots' | 'pulse'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  fullScreen?: boolean
}

export function LoadingIndicator({ 
  type = 'spinner', 
  size = 'md', 
  text, 
  className = '',
  fullScreen = false 
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const containerClass = fullScreen 
    ? 'fixed inset-0 bg-white bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50'
    : 'flex items-center justify-center'

  const renderSpinner = () => (
    <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizeClasses[size]}`} />
  )

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`bg-primary-600 rounded-full animate-pulse ${
            size === 'sm' ? 'h-2 w-2' : size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'
          }`}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )

  const renderPulse = () => (
    <div className={`bg-primary-200 rounded animate-pulse ${sizeClasses[size]}`} />
  )

  const renderContent = () => {
    switch (type) {
      case 'dots':
        return renderDots()
      case 'pulse':
        return renderPulse()
      case 'spinner':
      default:
        return renderSpinner()
    }
  }

  return (
    <div className={`${containerClass} ${className}`}>
      <div className="text-center">
        {renderContent()}
        {text && (
          <p className={`text-readable-muted mt-2 ${
            size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
          }`}>
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

// Skeleton components for different content types
export function BookingSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-8 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  )
}

export function WorkerCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 animate-pulse">
      <div className="flex items-center space-x-3 mb-3">
        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  )
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="ml-4 flex-1">
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b animate-pulse">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 animate-pulse">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MapSkeleton() {
  return (
    <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 bg-gray-300 rounded-full mx-auto mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-24 mx-auto mb-1"></div>
        <div className="h-2 bg-gray-300 rounded w-32 mx-auto"></div>
      </div>
    </div>
  )
}

// Default export for backward compatibility
export default function LoadingIndicatorDefault() {
  return <LoadingIndicator fullScreen size="xl" text="Loading..." />
}
