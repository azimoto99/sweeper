// Site configuration for different environments

export const getSiteUrl = () => {
  // Production URL - using actual Render deployment URL
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_SITE_URL || 'https://sweeper-margaritas-cleaning.onrender.com'
  }
  
  // Development URL
  return import.meta.env.VITE_APP_URL || 'http://localhost:5173'
}

export const getAuthCallbackUrl = () => {
  return `${getSiteUrl()}/auth/callback`
}

export const config = {
  siteUrl: getSiteUrl(),
  authCallbackUrl: getAuthCallbackUrl(),
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  mapbox: {
    accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
  },
  paypal: {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
  },
  business: {
    name: import.meta.env.VITE_BUSINESS_NAME || "Margarita's Cleaning Services",
    phone: import.meta.env.VITE_BUSINESS_PHONE,
    email: import.meta.env.VITE_BUSINESS_EMAIL,
    serviceArea: {
      lat: parseFloat(import.meta.env.VITE_SERVICE_AREA_LAT || '27.5306'),
      lng: parseFloat(import.meta.env.VITE_SERVICE_AREA_LNG || '-99.4803'),
      radiusMiles: parseInt(import.meta.env.VITE_SERVICE_RADIUS_MILES || '25'),
    },
  },
}