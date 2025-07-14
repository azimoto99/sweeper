import { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNotify } from '../../hooks/useNotify'
import {
  BellIcon,
  SpeakerWaveIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  XMarkIcon,
  CogIcon,
} from '@heroicons/react/24/outline'

interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  sound_notifications: boolean
  booking_updates: boolean
  worker_updates: boolean
  payment_notifications: boolean
  marketing_notifications: boolean
}

const defaultPreferences: NotificationPreferences = {
  email_notifications: true,
  push_notifications: true,
  sound_notifications: true,
  booking_updates: true,
  worker_updates: true,
  payment_notifications: true,
  marketing_notifications: false
}

export function NotificationSettings() {
  const { profile } = useAuthContext()
  const notify = useNotify()
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default'>('default')

  useEffect(() => {
    if (profile) {
      loadPreferences()
      checkNotificationPermission()
    }
  }, [profile])

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', profile!.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error
      }

      if (data) {
        setPreferences(data)
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission)
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setPermissionStatus(permission)
      
      if (permission === 'granted') {
        notify.success('Desktop notifications enabled!')
      } else if (permission === 'denied') {
        notify.error('Desktop notifications denied. You can enable them in your browser settings.')
      }
    }
  }

  const savePreferences = async () => {
    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: profile!.id,
          ...preferences,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      notify.success('Notification preferences saved!')
    } catch (error) {
      console.error('Error saving notification preferences:', error)
      notify.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const testNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Test Notification', {
        body: 'This is a test notification from Margarita\'s Cleaning Services',
        icon: '/favicon.ico',
        tag: 'test-notification'
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      setTimeout(() => notification.close(), 3000)
      notify.success('Test notification sent!')
    } else {
      notify.error('Desktop notifications not enabled')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-6 bg-gray-200 rounded w-10"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BellIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
          </div>
          <button
            onClick={savePreferences}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Desktop Notifications */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <ComputerDesktopIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-sm font-medium text-gray-900">Desktop Notifications</h3>
            </div>
            <div className="flex items-center space-x-2">
              {permissionStatus === 'granted' && (
                <button
                  onClick={testNotification}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Test
                </button>
              )}
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                permissionStatus === 'granted' 
                  ? 'bg-green-100 text-green-800' 
                  : permissionStatus === 'denied'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {permissionStatus === 'granted' ? 'Enabled' : 
                 permissionStatus === 'denied' ? 'Blocked' : 'Not Set'}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            Get desktop notifications for important updates even when the app is not open.
          </p>
          
          {permissionStatus !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
            >
              <BellIcon className="h-4 w-4 mr-2" />
              Enable Desktop Notifications
            </button>
          )}
        </div>

        {/* Notification Types */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Notification Types</h3>
          
          <div className="space-y-3">
            <NotificationToggle
              icon={BellIcon}
              label="Push Notifications"
              description="Receive notifications in your browser"
              checked={preferences.push_notifications}
              onChange={() => handleToggle('push_notifications')}
            />
            
            <NotificationToggle
              icon={SpeakerWaveIcon}
              label="Sound Notifications"
              description="Play sound when notifications arrive"
              checked={preferences.sound_notifications}
              onChange={() => handleToggle('sound_notifications')}
            />
            
            <NotificationToggle
              icon={DevicePhoneMobileIcon}
              label="Email Notifications"
              description="Send notifications to your email address"
              checked={preferences.email_notifications}
              onChange={() => handleToggle('email_notifications')}
            />
          </div>
        </div>

        {/* Notification Categories */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">What to notify me about</h3>
          
          <div className="space-y-3">
            <NotificationToggle
              icon={CheckCircleIcon}
              label="Booking Updates"
              description="Status changes for your bookings"
              checked={preferences.booking_updates}
              onChange={() => handleToggle('booking_updates')}
            />
            
            {(profile?.role === 'customer' || profile?.role === 'admin') && (
              <NotificationToggle
                icon={CogIcon}
                label="Worker Updates"
                description="Updates about your assigned worker"
                checked={preferences.worker_updates}
                onChange={() => handleToggle('worker_updates')}
              />
            )}
            
            <NotificationToggle
              icon={CogIcon}
              label="Payment Notifications"
              description="Payment confirmations and receipts"
              checked={preferences.payment_notifications}
              onChange={() => handleToggle('payment_notifications')}
            />
            
            <NotificationToggle
              icon={CogIcon}
              label="Marketing & Updates"
              description="Service updates and promotional offers"
              checked={preferences.marketing_notifications}
              onChange={() => handleToggle('marketing_notifications')}
            />
          </div>
        </div>

        {/* Browser Support Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Browser Support</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Desktop notifications work in Chrome, Firefox, Safari, and Edge</p>
            <p>• Sound notifications require user interaction first</p>
            <p>• You can manage notification permissions in your browser settings</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationToggle({
  icon: Icon,
  label,
  description,
  checked,
  onChange
}: {
  icon: any
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-start space-x-3">
        <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}