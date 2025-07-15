interface ServiceConfig {
  basePrice: number
  duration: number
  pricePerMile?: number
  timeBasedMultiplier?: {
    rush: number // Peak hours (before 9am, after 5pm)
    weekend: number // Saturday/Sunday
    holiday: number // Major holidays
  }
}

interface AddOn {
  id: string
  name: string
  price: number
  description?: string
}

interface PricingOptions {
  serviceType: string
  scheduledDate: string
  scheduledTime: string
  distanceFromCenter?: number
  addOns?: string[]
  isRecurring?: boolean
  subscriptionDiscount?: number
}

interface PricingResult {
  basePrice: number
  distanceCharge: number
  timeMultiplier: number
  addOnsTotal: number
  recurringDiscount: number
  subscriptionDiscount: number
  totalPrice: number
  breakdown: {
    service: number
    distance: number
    timeAdjustment: number
    addOns: number
    discounts: number
  }
}

// Service configurations from database
const SERVICE_CONFIGS: Record<string, ServiceConfig> = {
  regular: {
    basePrice: 120.00,
    duration: 2.5,
    pricePerMile: 2.50,
    timeBasedMultiplier: {
      rush: 1.15,
      weekend: 1.10,
      holiday: 1.25
    }
  },
  deep: {
    basePrice: 250.00,
    duration: 4.5,
    pricePerMile: 3.00,
    timeBasedMultiplier: {
      rush: 1.20,
      weekend: 1.15,
      holiday: 1.30
    }
  },
  move_in_out: {
    basePrice: 300.00,
    duration: 5.0,
    pricePerMile: 3.50,
    timeBasedMultiplier: {
      rush: 1.25,
      weekend: 1.20,
      holiday: 1.35
    }
  },
  airbnb: {
    basePrice: 80.00,
    duration: 1.5,
    pricePerMile: 2.00,
    timeBasedMultiplier: {
      rush: 1.10,
      weekend: 1.05,
      holiday: 1.20
    }
  },
  office: {
    basePrice: 150.00,
    duration: 3.0,
    pricePerMile: 2.75,
    timeBasedMultiplier: {
      rush: 1.15,
      weekend: 1.25, // Higher for weekend office cleaning
      holiday: 1.40
    }
  },
  commercial: {
    basePrice: 200.00,
    duration: 4.0,
    pricePerMile: 3.25,
    timeBasedMultiplier: {
      rush: 1.20,
      weekend: 1.30,
      holiday: 1.45
    }
  }
}

// Available add-ons
const AVAILABLE_ADD_ONS: Record<string, AddOn> = {
  inside_oven: { id: 'inside_oven', name: 'Inside Oven Cleaning', price: 25.00 },
  inside_fridge: { id: 'inside_fridge', name: 'Inside Refrigerator Cleaning', price: 25.00 },
  inside_windows: { id: 'inside_windows', name: 'Inside Window Cleaning', price: 30.00 },
  garage: { id: 'garage', name: 'Garage Cleaning', price: 40.00 },
  basement: { id: 'basement', name: 'Basement Cleaning', price: 35.00 },
  attic: { id: 'attic', name: 'Attic Cleaning', price: 30.00 },
  carpet_steam: { id: 'carpet_steam', name: 'Carpet Steam Cleaning', price: 50.00 },
  upholstery: { id: 'upholstery', name: 'Upholstery Cleaning', price: 40.00 }
}

// Business configuration
const BUSINESS_CONFIG = {
  serviceCenterLat: 27.5306, // Laredo, TX
  serviceCenterLng: -99.4803,
  maxServiceRadius: 25, // miles
  minimumCharge: 80.00,
  recurringDiscount: 0.10, // 10% for recurring services
  rushHours: {
    morning: { start: 6, end: 9 }, // 6 AM - 9 AM
    evening: { start: 17, end: 20 } // 5 PM - 8 PM
  },
  holidays: [
    '2024-01-01', '2024-07-04', '2024-11-28', '2024-12-25', // Add more holidays
    '2025-01-01', '2025-07-04', '2025-11-27', '2025-12-25'
  ]
}

export function calculateServicePrice(options: PricingOptions): PricingResult {
  const serviceConfig = SERVICE_CONFIGS[options.serviceType]
  if (!serviceConfig) {
    throw new Error(`Unknown service type: ${options.serviceType}`)
  }

  const date = new Date(options.scheduledDate)
  const time = options.scheduledTime
  const [hours, minutes] = time.split(':').map(Number)

  // Base price
  const basePrice = serviceConfig.basePrice

  // Distance-based pricing
  const distanceFromCenter = options.distanceFromCenter || 0
  const distanceCharge = distanceFromCenter > 5 
    ? (distanceFromCenter - 5) * (serviceConfig.pricePerMile || 0) 
    : 0

  // Time-based multiplier
  let timeMultiplier = 1.0
  const isWeekend = date.getDay() === 0 || date.getDay() === 6
  const isHoliday = BUSINESS_CONFIG.holidays.includes(options.scheduledDate)
  const isRushHour = 
    (hours >= BUSINESS_CONFIG.rushHours.morning.start && hours < BUSINESS_CONFIG.rushHours.morning.end) ||
    (hours >= BUSINESS_CONFIG.rushHours.evening.start && hours < BUSINESS_CONFIG.rushHours.evening.end)

  if (isHoliday) {
    timeMultiplier = serviceConfig.timeBasedMultiplier?.holiday || 1.0
  } else if (isWeekend) {
    timeMultiplier = serviceConfig.timeBasedMultiplier?.weekend || 1.0
  } else if (isRushHour) {
    timeMultiplier = serviceConfig.timeBasedMultiplier?.rush || 1.0
  }

  // Add-ons calculation
  const addOnsTotal = (options.addOns || []).reduce((total, addOnId) => {
    const addOn = AVAILABLE_ADD_ONS[addOnId]
    return addOn ? total + addOn.price : total
  }, 0)

  // Calculate subtotal before discounts
  const serviceTotal = basePrice * timeMultiplier
  const subtotal = serviceTotal + distanceCharge + addOnsTotal

  // Recurring service discount
  const recurringDiscount = options.isRecurring 
    ? subtotal * BUSINESS_CONFIG.recurringDiscount 
    : 0

  // Subscription discount
  const subscriptionDiscount = options.subscriptionDiscount 
    ? subtotal * (options.subscriptionDiscount / 100) 
    : 0

  // Calculate final total
  const totalDiscounts = recurringDiscount + subscriptionDiscount
  const totalPrice = Math.max(
    subtotal - totalDiscounts,
    BUSINESS_CONFIG.minimumCharge
  )

  return {
    basePrice,
    distanceCharge,
    timeMultiplier,
    addOnsTotal,
    recurringDiscount,
    subscriptionDiscount,
    totalPrice: Math.round(totalPrice * 100) / 100, // Round to 2 decimal places
    breakdown: {
      service: Math.round(serviceTotal * 100) / 100,
      distance: Math.round(distanceCharge * 100) / 100,
      timeAdjustment: Math.round((serviceTotal - basePrice) * 100) / 100,
      addOns: Math.round(addOnsTotal * 100) / 100,
      discounts: Math.round(totalDiscounts * 100) / 100
    }
  }
}

// Helper function to get service configuration
export function getServiceConfig(serviceType: string): ServiceConfig | null {
  return SERVICE_CONFIGS[serviceType] || null
}

// Helper function to get available add-ons for a service
export function getAvailableAddOns(serviceType: string): AddOn[] {
  // Return all add-ons for now, but could be filtered per service type
  return Object.values(AVAILABLE_ADD_ONS)
}

// Helper function to calculate distance between two points
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Helper function to validate if location is within service area
export function isWithinServiceArea(lat: number, lng: number): boolean {
  const distance = calculateDistance(
    BUSINESS_CONFIG.serviceCenterLat,
    BUSINESS_CONFIG.serviceCenterLng,
    lat,
    lng
  )
  return distance <= BUSINESS_CONFIG.maxServiceRadius
}

// Helper function to get pricing explanation
export function getPricingExplanation(options: PricingOptions): string[] {
  const serviceConfig = SERVICE_CONFIGS[options.serviceType]
  if (!serviceConfig) return []

  const result = calculateServicePrice(options)
  const explanations: string[] = []

  explanations.push(`Base ${options.serviceType.replace('_', ' ')} service: $${result.basePrice}`)

  if (result.timeMultiplier > 1) {
    const multiplierPercent = Math.round((result.timeMultiplier - 1) * 100)
    explanations.push(`Time adjustment (+${multiplierPercent}%): +$${result.breakdown.timeAdjustment}`)
  }

  if (result.distanceCharge > 0) {
    explanations.push(`Distance charge: +$${result.breakdown.distance}`)
  }

  if (result.addOnsTotal > 0) {
    explanations.push(`Add-ons: +$${result.breakdown.addOns}`)
  }

  if (result.recurringDiscount > 0) {
    explanations.push(`Recurring service discount: -$${result.recurringDiscount}`)
  }

  if (result.subscriptionDiscount > 0) {
    explanations.push(`Subscription discount: -$${result.subscriptionDiscount}`)
  }

  return explanations
}

export { BUSINESS_CONFIG, SERVICE_CONFIGS, AVAILABLE_ADD_ONS }
export type { ServiceConfig, AddOn, PricingOptions, PricingResult }