import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          address: string | null
          role: 'customer' | 'worker' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          address?: string | null
          role?: 'customer' | 'worker' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          address?: string | null
          role?: 'customer' | 'worker' | 'admin'
          updated_at?: string
        }
      }
      workers: {
        Row: {
          id: string
          profile_id: string
          status: 'available' | 'en_route' | 'on_job' | 'break' | 'offline'
          current_location_lat: number | null
          current_location_lng: number | null
          last_location_update: string | null
          assigned_bookings_count: number
          vehicle_info: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          status?: 'available' | 'en_route' | 'on_job' | 'break' | 'offline'
          current_location_lat?: number | null
          current_location_lng?: number | null
          last_location_update?: string | null
          assigned_bookings_count?: number
          vehicle_info?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'available' | 'en_route' | 'on_job' | 'break' | 'offline'
          current_location_lat?: number | null
          current_location_lng?: number | null
          last_location_update?: string | null
          assigned_bookings_count?: number
          vehicle_info?: string | null
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          worker_id: string | null
          service_type: 'regular' | 'deep' | 'move_in_out' | 'airbnb' | 'office' | 'commercial'
          scheduled_date: string
          scheduled_time: string
          address: string
          status: 'pending' | 'assigned' | 'en_route' | 'in_progress' | 'completed' | 'cancelled'
          price: number
          notes: string | null
          paypal_order_id: string | null
          location_lat: number
          location_lng: number
          add_ons: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          worker_id?: string | null
          service_type: 'regular' | 'deep' | 'move_in_out' | 'airbnb' | 'office' | 'commercial'
          scheduled_date: string
          scheduled_time: string
          address: string
          status?: 'pending' | 'assigned' | 'en_route' | 'in_progress' | 'completed' | 'cancelled'
          price: number
          notes?: string | null
          paypal_order_id?: string | null
          location_lat: number
          location_lng: number
          add_ons?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          worker_id?: string | null
          status?: 'pending' | 'assigned' | 'en_route' | 'in_progress' | 'completed' | 'cancelled'
          price?: number
          notes?: string | null
          paypal_order_id?: string | null
          add_ons?: string[] | null
          updated_at?: string
        }
      }
    }
  }
}