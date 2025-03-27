export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      self_aspect_cards: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          traits: string[]
          status: 'new' | 'collected' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          traits: string[]
          status: 'new' | 'collected' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          traits?: string[]
          status?: 'new' | 'collected' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      onboarding_data: {
        Row: {
          id: string
          user_id: string
          social_data: Json
          personal_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          social_data?: Json
          personal_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          social_data?: Json
          personal_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 