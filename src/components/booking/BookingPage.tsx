import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import { useNotify } from '../../hooks/useNotify'
import { supabase } from '../../lib/supabase'
import { sendBookingNotification } from '../../lib/notifications'
import { PayPalButton } from '../payment/PayPalButton'
import { AddressInput } from '../forms/AddressInput'
import { 
  calculateServicePrice, 
  getServiceConfig, 
  getAvailableAddOns,
  calculateDistance,
  getPricingExplanation,
  BUSINESS_CONFIG,
  type PricingResult
} from '../../utils/pricingCalculator'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  HomeIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

// Get service types from pricing calculator
const getServiceTypes = () => {
  return [
    {
      id: 'regular',
      name: 'Regular Cleaning',
      description: 'Standard house cleaning service',
      config: getServiceConfig('regular')!,
      icon: HomeIcon
    },
    {
      id: 'deep', 
      name: 'Deep Cleaning',
      description: 'Thorough cleaning for move-ins or spring cleaning',
      config: getServiceConfig('deep')!,
      icon: SparklesIcon
    },
    {
      id: 'airbnb',
      name: 'Airbnb Cleaning', 
      description: 'Quick turnaround cleaning for short-term rentals',
      config: getServiceConfig('airbnb')!,
      icon: HomeIcon
    },
    {
      id: 'office',
      name: 'Office Cleaning',
      description: 'Commercial office space cleaning', 
      config: getServiceConfig('office')!,
      icon: BuildingOfficeIcon
    },
    {
      id: 'move_in_out',
      name: 'Move In/Out',
      description: 'Complete move-in or move-out cleaning',
      config: getServiceConfig('move_in_out')!,
      icon: SparklesIcon
    },
    {
      id: 'commercial',
      name: 'Commercial',
      description: 'Large commercial space cleaning',
      config: getServiceConfig('commercial')!,
      icon: BuildingOfficeIcon
    }
  ].filter(service => service.config) // Filter out any services without config
}

const SERVICE_TYPES = getServiceTypes()

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
    add_ons: [] as string[],
    is_recurring: false
  })
  
  const [locationData, setLocationData] = useState<{
    lat: number
    lng: number
    address: string
  } | null>(null)

  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null)
  const [showPricingBreakdown, setShowPricingBreakdown] = useState(false)

  const selectedService = SERVICE_TYPES.find(s => s.id === formData.service_type)
  const availableAddOns = formData.service_type ? getAvailableAddOns(formData.service_type) : []

  // Calculate dynamic pricing
  useEffect(() => {
    if (formData.service_type && formData.scheduled_date && formData.scheduled_time && locationData) {
      try {
        const distanceFromCenter = calculateDistance(
          BUSINESS_CONFIG.serviceCenterLat,
          BUSINESS_CONFIG.serviceCenterLng,
          locationData.lat,
          locationData.lng
        )

        const pricing = calculateServicePrice({
          serviceType: formData.service_type,
          scheduledDate: formData.scheduled_date,
          scheduledTime: formData.scheduled_time,
          distanceFromCenter,
          addOns: formData.add_ons,
          isRecurring: formData.is_recurring,
          subscriptionDiscount: 0 // TODO: Get from user's subscription
        })

        setPricingResult(pricing)
      } catch (error) {
        console.error('Error calculating pricing:', error)
        setPricingResult(null)
      }
    } else {
      setPricingResult(null)
    }
  }, [formData, locationData])

  const totalPrice = pricingResult?.totalPrice || (selectedService?.config.basePrice || 0)

  // Authentication check for payment step
  const requiresAuth = step === 3

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
    
    // Check if user is authenticated before proceeding to payment
    if (!profile) {
      notify.error('Please sign in to complete your booking')
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
        add_ons: [],
        is_recurring: false
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50 to-emerald-50">
      {/* Header */}
      <div className="glass border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center text-gray-600 hover:text-primary-600 transition-colors group">
              <ArrowLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Home
            </Link>
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <SparklesIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Book Your Service</h1>
                <p className="text-sm text-gray-500">Professional cleaning made simple</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-8">
            {[
              { number: 1, title: 'Service', active: step >= 1 },
              { number: 2, title: 'Schedule', active: step >= 2 },
              { number: 3, title: 'Payment', active: step >= 3 }
            ].map((stepItem, index) => (
              <div key={stepItem.number} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg transition-all duration-300 ${
                  stepItem.active 
                    ? 'bg-gradient-to-br from-primary-500 to-emerald-600 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepItem.active && step > stepItem.number ? (
                    <CheckCircleIcon className="h-6 w-6" />
                  ) : (
                    stepItem.number
                  )}
                </div>
                <span className={`ml-3 font-medium ${stepItem.active ? 'text-gray-900' : 'text-gray-500'}`}>
                  {stepItem.title}
                </span>
                {index < 2 && (
                  <div className={`w-16 h-1 mx-6 rounded-full transition-colors duration-300 ${
                    step > stepItem.number ? 'bg-gradient-to-r from-primary-500 to-emerald-600' : 'bg-gray-200'
                  }`} />
                )}
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
                  <span className="text-2xl font-bold text-primary-600">From ${service.config.basePrice}</span>
                  <span className="text-sm text-gray-500">{service.config.duration}h</span>
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
                <p className="text-sm text-gray-600">From ${selectedService.config.basePrice} • {selectedService.config.duration} hours</p>
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
                {availableAddOns.map((addon) => (
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
                      {addon.description && (
                        <p className="text-xs text-gray-500 mt-1">{addon.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Recurring Service Option */}
            <div>
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Recurring Service</span>
                  <span className="text-sm text-green-600 ml-2">Save 10%</span>
                  <p className="text-xs text-gray-500 mt-1">Schedule this service to repeat weekly, bi-weekly, or monthly</p>
                </div>
              </label>
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

            <div className="pt-6 border-t">
              {/* Pricing Display */}
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    Total: ${totalPrice}
                  </div>
                  {pricingResult && (
                    <button
                      type="button"
                      onClick={() => setShowPricingBreakdown(!showPricingBreakdown)}
                      className="flex items-center text-sm text-primary-600 hover:text-primary-500 mt-1"
                    >
                      <InformationCircleIcon className="h-4 w-4 mr-1" />
                      {showPricingBreakdown ? 'Hide' : 'Show'} pricing details
                    </button>
                  )}
                </div>
                {profile ? (
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    Continue to Payment
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Sign in to complete your booking</p>
                    <div className="flex space-x-3">
                      <Link
                        to="/auth/login"
                        className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/auth/signup"
                        className="flex-1 px-6 py-2 border border-primary-600 text-primary-600 rounded-md hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              {showPricingBreakdown && pricingResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-3">Pricing Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    {getPricingExplanation({
                      serviceType: formData.service_type,
                      scheduledDate: formData.scheduled_date,
                      scheduledTime: formData.scheduled_time,
                      distanceFromCenter: locationData ? calculateDistance(
                        BUSINESS_CONFIG.serviceCenterLat,
                        BUSINESS_CONFIG.serviceCenterLng,
                        locationData.lat,
                        locationData.lng
                      ) : 0,
                      addOns: formData.add_ons,
                      isRecurring: formData.is_recurring
                    }).map((explanation, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-600">{explanation.split(':')[0]}:</span>
                        <span className="font-medium">{explanation.split(':')[1]}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${pricingResult.totalPrice}</span>
                    </div>
                  </div>
                </div>
              )}
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
              {formData.add_ons.length > 0 && (
                <div className="flex justify-between">
                  <span>Add-ons:</span>
                  <span>{formData.add_ons.map(id => availableAddOns.find(a => a.id === id)?.name).filter(Boolean).join(', ')}</span>
                </div>
              )}
              {formData.is_recurring && (
                <div className="flex justify-between">
                  <span>Recurring Service:</span>
                  <span className="text-green-600">10% discount applied</span>
                </div>
              )}
              {pricingResult && pricingResult.breakdown.discounts > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Total Discounts:</span>
                  <span>-${pricingResult.breakdown.discounts}</span>
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
              {formData.add_ons.length > 0 && (
                <div className="flex justify-between">
                  <span>Add-ons:</span>
                  <span>{formData.add_ons.map(id => availableAddOns.find(a => a.id === id)?.name).filter(Boolean).join(', ')}</span>
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
