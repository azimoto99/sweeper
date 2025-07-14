import { useState } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { useNotify } from '../../hooks/useNotify'
import { supabase } from '../../lib/supabase'
import { sendBookingNotification } from '../../lib/notifications'
import { PayPalButton } from '../payment/PayPalButton'
import { AddressInput } from '../forms/AddressInput'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  HomeIcon,
  BuildingOfficeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

const SERVICE_TYPES = [
  {
    id: 'regular',
    name: 'Regular Cleaning',
    description: 'Standard house cleaning service',
    basePrice: 80,
    duration: 2,
    icon: HomeIcon
  },
  {
    id: 'deep',
    name: 'Deep Cleaning',
    description: 'Thorough cleaning for move-ins or spring cleaning',
    basePrice: 150,
    duration: 4,
    icon: SparklesIcon
  },
  {
    id: 'office',
    name: 'Office Cleaning',
    description: 'Commercial office space cleaning',
    basePrice: 120,
    duration: 3,
    icon: BuildingOfficeIcon
  }
]

const ADD_ONS = [
  { id: 'inside_oven', name: 'Inside Oven', price: 25 },
  { id: 'inside_fridge', name: 'Inside Refrigerator', price: 25 },
  { id: 'inside_windows', name: 'Inside Windows', price: 30 },
  { id: 'garage', name: 'Garage Cleaning', price: 40 }
]

export function BookingPage() {
  const { profile } = useAuthContext()
  const notify = useNotify()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    service_type: '',
    scheduled_date: '',
    scheduled_time: '',
    address: '',
    notes: '',
    add_ons: [] as string[]
  })
  
  const [locationData, setLocationData] = useState<{
    lat: number
    lng: number
    address: string
  } | null>(null)

  const selectedService = SERVICE_TYPES.find(s => s.id === formData.service_type)
  const selectedAddOns = ADD_ONS.filter(addon => formData.add_ons.includes(addon.id))
  const totalPrice = (selectedService?.basePrice || 0) + selectedAddOns.reduce((sum, addon) => sum + addon.price, 0)

  const handleServiceSelect = (serviceId: string) => {
    setFormData({ ...formData, service_type: serviceId })
    setStep(2)
  }

  const handleAddOnToggle = (addonId: string) => {
    const newAddOns = formData.add_ons.includes(addonId)
      ? formData.add_ons.filter(id => id !== addonId)
      : [...formData.add_ons, addonId]
    
    setFormData({ ...formData, add_ons: newAddOns })
  }

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.scheduled_date || !formData.scheduled_time || !formData.address) {
      notify.error('Please fill in all required fields')
      return
    }
    if (!locationData) {
      notify.error('Please select a valid address from the suggestions')
      return
    }
    setStep(3)
  }

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setLocationData(location)
    setFormData({ ...formData, address: location.address })
  }

  const handlePaymentSuccess = async (orderId: string, details: any) => {
    try {
      setLoading(true)
      
      // Create booking in database
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: profile!.id,
          service_type: formData.service_type as any,
          scheduled_date: formData.scheduled_date,
          scheduled_time: formData.scheduled_time,
          address: formData.address,
          notes: formData.notes || null,
          price: totalPrice,
          paypal_order_id: orderId,
          location_lat: locationData?.lat || 27.5306, // Use geocoded coordinates
          location_lng: locationData?.lng || -99.4803,
          add_ons: formData.add_ons.length > 0 ? formData.add_ons : null,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      // Send notification to admins about new booking
      const { data: adminUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (adminUsers && adminUsers.length > 0) {
        await sendBookingNotification(
          adminUsers.map(u => u.id),
          'New Booking Created',
          `A new ${formData.service_type} cleaning booking has been created for ${formData.address}`,
          'info'
        )
      }

      notify.success('Booking created successfully!')
      
      // Reset form
      setFormData({
        service_type: '',
        scheduled_date: '',
        scheduled_time: '',
        address: '',
        notes: '',
        add_ons: []
      })
      setLocationData(null)
      setStep(1)
      
    } catch (error) {
      console.error('Error creating booking:', error)
      notify.error('Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error)
    notify.error('Payment failed. Please try again.')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Book a Service</h1>
        <p className="text-gray-600 mt-2">Schedule your cleaning service in just a few steps</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-8">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNum ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {stepNum}
              </div>
              <span className={`ml-2 text-sm ${step >= stepNum ? 'text-primary-600' : 'text-gray-500'}`}>
                {stepNum === 1 ? 'Service' : stepNum === 2 ? 'Schedule' : 'Payment'}
              </span>
              {stepNum < 3 && <div className="w-16 h-0.5 bg-gray-200 ml-4" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Service Selection */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Choose Your Service</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SERVICE_TYPES.map((service) => (
              <div
                key={service.id}
                onClick={() => handleServiceSelect(service.id)}
                className="border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-primary-500 hover:shadow-md transition-all"
              >
                <service.icon className="h-8 w-8 text-primary-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{service.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary-600">${service.basePrice}</span>
                  <span className="text-sm text-gray-500">{service.duration}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Schedule & Details */}
      {step === 2 && selectedService && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Schedule Your Service</h2>
            <button
              onClick={() => setStep(1)}
              className="text-primary-600 hover:text-primary-500 text-sm"
            >
              Change Service
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <selectedService.icon className="h-6 w-6 text-primary-600" />
              <div>
                <h3 className="font-medium text-gray-900">{selectedService.name}</h3>
                <p className="text-sm text-gray-600">${selectedService.basePrice} • {selectedService.duration} hours</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleScheduleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="inline h-4 w-4 mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ClockIcon className="inline h-4 w-4 mr-1" />
                  Time
                </label>
                <select
                  required
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select time</option>
                  <option value="08:00">8:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPinIcon className="inline h-4 w-4 mr-1" />
                Service Address
              </label>
              <AddressInput
                value={formData.address}
                onChange={(value) => setFormData({ ...formData, address: value })}
                onLocationSelect={handleLocationSelect}
                placeholder="Enter your full service address..."
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Add-ons</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ADD_ONS.map((addon) => (
                  <label key={addon.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.add_ons.includes(addon.id)}
                      onChange={() => handleAddOnToggle(addon.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{addon.name}</span>
                      <span className="text-sm text-primary-600 ml-2">+${addon.price}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special instructions or areas to focus on..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-between items-center pt-6 border-t">
              <div className="text-lg font-semibold text-gray-900">
                Total: ${totalPrice}
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Continue to Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Payment</h2>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-medium text-gray-900 mb-4">Booking Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Service:</span>
                <span>{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>{formData.scheduled_date} at {formData.scheduled_time}</span>
              </div>
              <div className="flex justify-between">
                <span>Address:</span>
                <span className="text-right max-w-xs">{formData.address}</span>
              </div>
              {selectedAddOns.length > 0 && (
                <div className="flex justify-between">
                  <span>Add-ons:</span>
                  <span>{selectedAddOns.map(a => a.name).join(', ')}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span>${totalPrice}</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
            <div className="flex-1">
              <PayPalButton
                amount={totalPrice}
                description={`${selectedService?.name} - ${formData.scheduled_date}`}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
