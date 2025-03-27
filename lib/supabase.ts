import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

// Types for our database tables
export type Tables = Database['public']['Tables']
export type UserProfile = Tables['user_profiles']['Row']
export type SelfAspectCardDB = Tables['self_aspect_cards']['Row']
export type OnboardingDataDB = Tables['onboarding_data']['Row']

// Helper function to check if Supabase is configured correctly
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('self_aspect_cards').select('count').limit(1)
    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Supabase connection test error:', error)
    return false
  }
} 