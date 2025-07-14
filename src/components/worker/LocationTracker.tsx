import { useState, useEffect } from 'react'
import { useLocationTracking } from '../../hooks/useLocationTracking'
import { 
  MapPinIcon, 
  SignalIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  CogIcon,
  Battery0Icon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline'

interface LocationTrackerProps {
  workerId: string
  isActive: boolean
  onToggle: (enabled: boolean) => void
  className?: string
}

export function LocationTracker({ workerId, isActive, onToggle, className = '' }: LocationTrackerProps) {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [isLowPowerMode, setIsLowPowerMode] = useState(false)
  const [locationHistory, setLocationHistory] = useState<Array<{
    timestamp: Date
    accuracy: number
    speed?: number
  }>>([])

  const { 
    isTracking, 
    lastUpdate, 
    error, 
    permissionStatus 
  } = useLocationTracking({
    workerId,
    enabled: isActive,
    highAccuracy: !isLowPowerMode,
    updateInterval: isLowPowerMode ? 60000 : 30000, // 1 min vs 30 sec
    maxAge: isLowPowerMode ? 60000 : 30000
  })

  // Check battery level and connection status
  useEffect(() => {
    const checkBatteryStatus = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery()
          setBatteryLevel(Math.round(battery.level * 100))
          
          // Auto-enable low power mode if battery is low
          if (battery.level < 0.2 && !isLowPowerMode) {
            setIsLowPowerMode(true)
          }
          
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100))
          })
        } catch (error) {
          console.log('Battery API not available')
        }
      }
    }

    checkBatteryStatus()
  }, [isLowPowerMode])

  // Track location history for analytics
  useEffect(() => {
    if (lastUpdate) {
      setLocationHistory(prev => [
        ...prev.slice(-10), // Keep last 10 updates
        {
          timestamp: lastUpdate,
          accuracy: 10, // Simplified for demo
          speed: Math.random() * 30 // Simplified for demo
        }
      ])
    }
  }, [lastUpdate])

  const getStatusColor = () => {
    if (error) return 'text-red-600'
    if (isTracking) return 'text-green-600'
    if (permissionStatus === 'denied') return 'text-red-600'
    return 'text-gray-600'
  }

  const getStatusIcon = () => {
    if (error) return <ExclamationTriangleIcon className="h-5 w-5" />
    if (isTracking) return <CheckCircleIcon className="h-5 w-5" />
    if (permissionStatus === 'denied') return <ExclamationTriangleIcon className="h-5 w-5" />
    return <MapPinIcon className="h-5 w-5" />
  }

  const getStatusText = () => {
    if (error) return 'Location Error'
    if (isTracking) return 'Tracking Active'
    if (permissionStatus === 'denied') return 'Permission Denied'
    if (permissionStatus === 'granted') return 'Ready to Track'
    return 'Location Off'
  }

  const formatTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={getStatusColor()}>
              {getStatusIcon()}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Location Tracking</h3>
              <p className={`text-sm ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Battery indicator */}
            {batteryLevel !== null && (
              <div className="flex items-center text-xs text-gray-500">
                <Battery0Icon className="h-4 w-4 mr-1" />
                {batteryLevel}%
              </div>
            )}
            
            {/* Toggle switch */}
            <button
              onClick={() => onToggle(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Status Details */}
        {isActive && (
          <div className="space-y-3">
            {/* Last Update */}
            {lastUpdate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Update:</span>
                <span className="font-medium">{formatTimeSince(lastUpdate)}</span>
              </div>
            )}

            {/* Location History */}
            {locationHistory.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Recent Updates</h4>
                <div className="bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
                  {locationHistory.slice(-5).reverse().map((location, index) => (
                    <div key={index} className="flex items-center justify-between text-xs py-1">
                      <span className="text-gray-600">
                        {location.timestamp.toLocaleTimeString()}
                      </span>
                      <div className="flex items-center space-x-2 text-gray-500">
                        <span>±{location.accuracy}m</span>
                        {location.speed && (
                          <span>{Math.round(location.speed)} mph</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Settings</h4>
              
              {/* Low Power Mode */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Battery0Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Low Power Mode</span>
                </div>
                <button
                  onClick={() => setIsLowPowerMode(!isLowPowerMode)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isLowPowerMode ? 'bg-yellow-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      isLowPowerMode ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="text-xs text-gray-500">
                {isLowPowerMode 
                  ? 'Updates every 1 minute, reduced accuracy'
                  : 'Updates every 30 seconds, high accuracy'
                }
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-400 mr-2" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Permission Request */}
            {permissionStatus === 'denied' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400 mr-2" />
                  <div className="text-sm text-yellow-700">
                    <p>Location permission denied.</p>
                    <p className="mt-1">Please enable location services in your browser settings.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {isActive && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  // Request immediate location update
                  navigator.geolocation.getCurrentPosition(
                    () => {},
                    () => {},
                    { enableHighAccuracy: true }
                  )
                }}
                className="flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm"
              >
                <SignalIcon className="h-4 w-4 mr-1" />
                Update Now
              </button>
              
              <button
                onClick={() => setIsLowPowerMode(!isLowPowerMode)}
                className="flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-sm"
              >
                <CogIcon className="h-4 w-4 mr-1" />
                {isLowPowerMode ? 'High Accuracy' : 'Power Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}