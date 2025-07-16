export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  role: 'customer' | 'worker' | 'admin';
  created_at: string;
}

export interface Worker extends User {
  profile_id: string;
  status: 'available' | 'en_route' | 'on_job' | 'break' | 'offline';
  current_location?: {
    lat: number;
    lng: number;
  };
  current_location_lat?: number;
  current_location_lng?: number;
  last_location_update?: string;
  assigned_bookings_count: number;
  vehicle_info?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  license_number?: string;
  hourly_rate?: number;
  max_radius?: number;
  skills?: string[];
  notes?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  worker_id?: string;
  service_type: 'regular' | 'deep' | 'move_in_out' | 'airbnb' | 'office' | 'commercial';
  scheduled_date: string;
  scheduled_time: string;
  address: string;
  status: 'pending' | 'assigned' | 'confirmed' | 'en_route' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  notes?: string;
  paypal_order_id?: string;
  location_lat: number;
  location_lng: number;
  add_ons?: string[];
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  booking_id: string;
  worker_id: string;
  assigned_at: string;
  status: 'assigned' | 'accepted' | 'en_route' | 'arrived' | 'in_progress' | 'completed';
  estimated_arrival?: string;
  actual_arrival?: string;
  completion_time?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: 'silver' | 'gold' | 'platinum';
  paypal_subscription_id: string;
  status: 'active' | 'cancelled' | 'expired';
  next_billing_date: string;
  discount_percentage: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  inventory: number;
  image_url?: string;
  category: string;
  active: boolean;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paypal_order_id: string;
  paypal_capture_id?: string;
  items: OrderItem[];
  shipping_address: Address;
  created_at: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Review {
  id: string;
  user_id: string;
  booking_id: string;
  worker_id?: string;
  rating: number;
  comment?: string;
  photos?: string[];
  created_at: string;
  user?: User;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: 'percentage' | 'fixed';
  valid_until: string;
  usage_limit: number;
  times_used: number;
  active: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface ServiceConfig {
  id: string;
  service_type: string;
  base_price: number;
  description: string;
  duration_hours: number;
  add_ons: ServiceAddOn[];
}

export interface ServiceAddOn {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface WorkerLocation {
  worker_id: string;
  lat: number;
  lng: number;
  timestamp: string;
  heading?: number;
  speed?: number;
}

export interface DispatchState {
  selectedBooking?: Booking;
  selectedWorker?: Worker;
  isDragging: boolean;
  mapCenter: [number, number];
  mapZoom: number;
  showWorkerRoutes: boolean;
  showTrafficLayer: boolean;
}

export interface BookingFilters {
  status?: Booking['status'];
  service_type?: Booking['service_type'];
  date_from?: string;
  date_to?: string;
  worker_id?: string;
}

export interface WorkerFilters {
  status?: Worker['status'];
  available_only?: boolean;
}

export interface AnalyticsData {
  total_bookings: number;
  completed_bookings: number;
  revenue: number;
  active_workers: number;
  average_rating: number;
  growth_percentage: number;
}