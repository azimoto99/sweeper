import { useState } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { useBookingNotifications } from '../../hooks/useBookingNotifications'
import { CustomerDashboard } from './CustomerDashboard'
import { CustomerTracker } from './CustomerTracker'
import {
  HomeIcon,
  ClockIcon,
  UserIcon,
  CogIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'

export function CustomerApp() {
  const { profile } = useAuthContext()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'support'>('dashboard')

  // Enable booking notifications for customers
  useBookingNotifications({
    enabled: true,
    playSound: true,
    showDesktopNotifications: true
  })

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to access the customer dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-friendly header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Welcome, {profile.full_name || 'Customer'}
              </h1>
              <p className="text-sm text-gray-600">Margarita's Cleaning Services</p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                <PhoneIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <HomeIcon className="h-4 w-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserIcon className="h-4 w-4 inline mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'support'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PhoneIcon className="h-4 w-4 inline mr-2" />
              Support
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'dashboard' && <CustomerDashboard />}
        {activeTab === 'profile' && <CustomerProfile />}
        {activeTab === 'support' && <CustomerSupport />}
      </div>
    </div>
  )
}

function CustomerProfile() {
  const { profile } = useAuthContext()
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
              {profile?.full_name || 'Not provided'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
              {profile?.email || 'Not provided'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
              {profile?.phone || 'Not provided'}
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CustomerSupport() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Support</h2>
        
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <PhoneIcon className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Call Us</h3>
                <p className="text-sm text-gray-600">Available 24/7 for emergencies</p>
                <p className="text-primary-600 font-medium">(956) 555-0123</p>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <MapPinIcon className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Service Area</h3>
                <p className="text-sm text-gray-600">Laredo, TX and surrounding areas</p>
                <p className="text-sm text-gray-600">25-mile radius from downtown</p>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Business Hours</h3>
                <p className="text-sm text-gray-600">Monday - Friday: 8:00 AM - 6:00 PM</p>
                <p className="text-sm text-gray-600">Saturday: 9:00 AM - 4:00 PM</p>
                <p className="text-sm text-gray-600">Sunday: Emergency only</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}