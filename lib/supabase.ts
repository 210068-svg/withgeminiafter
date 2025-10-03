import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database型定義
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      devices: {
        Row: {
          id: string
          user_id: string
          device_name: string
          device_type: string
          phone_number: string | null
          emergency_contact: string | null
          notes: string | null
          pairing_code: string
          is_active: boolean
          last_location_lat: number | null
          last_location_lng: number | null
          last_location_time: string | null
          battery_level: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_name: string
          device_type: string
          phone_number?: string | null
          emergency_contact?: string | null
          notes?: string | null
          pairing_code: string
          is_active?: boolean
          last_location_lat?: number | null
          last_location_lng?: number | null
          last_location_time?: string | null
          battery_level?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_name?: string
          device_type?: string
          phone_number?: string | null
          emergency_contact?: string | null
          notes?: string | null
          pairing_code?: string
          is_active?: boolean
          last_location_lat?: number | null
          last_location_lng?: number | null
          last_location_time?: string | null
          battery_level?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      caregivers: {
        Row: {
          id: string
          user_id: string
          name: string
          relationship: string
          phone_number: string | null
          email: string | null
          notification_methods: string[]
          priority: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          relationship: string
          phone_number?: string | null
          email?: string | null
          notification_methods?: string[]
          priority?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          relationship?: string
          phone_number?: string | null
          email?: string | null
          notification_methods?: string[]
          priority?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      geofences: {
        Row: {
          id: string
          user_id: string
          name: string
          area_type: string
          center_lat: number
          center_lng: number
          radius: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          area_type: string
          center_lat: number
          center_lng: number
          radius: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          area_type?: string
          center_lat?: number
          center_lng?: number
          radius?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          device_id: string
          alert_type: string
          severity: string
          message: string
          location_lat: number | null
          location_lng: number | null
          is_resolved: boolean
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_id: string
          alert_type: string
          severity: string
          message: string
          location_lat?: number | null
          location_lng?: number | null
          is_resolved?: boolean
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string
          alert_type?: string
          severity?: string
          message?: string
          location_lat?: number | null
          location_lng?: number | null
          is_resolved?: boolean
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      location_history: {
        Row: {
          id: string
          device_id: string
          latitude: number
          longitude: number
          accuracy: number
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          device_id: string
          latitude: number
          longitude: number
          accuracy: number
          timestamp: string
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          latitude?: number
          longitude?: number
          accuracy?: number
          timestamp?: string
          created_at?: string
        }
      }
      setup_progress: {
        Row: {
          id: string
          user_id: string
          has_device: boolean
          has_contacts: boolean
          has_geofence: boolean
          is_complete: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          has_device?: boolean
          has_contacts?: boolean
          has_geofence?: boolean
          is_complete?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          has_device?: boolean
          has_contacts?: boolean
          has_geofence?: boolean
          is_complete?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
