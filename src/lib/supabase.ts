// Centralized Supabase client to avoid multiple instances
import { createClient } from '@supabase/supabase-js'

// Create single instance
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)