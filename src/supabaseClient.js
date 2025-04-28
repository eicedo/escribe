import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Always validate environment variables
if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is required - please check your .env file')
}

if (!supabaseKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is required - please check your .env file')
}

console.log('Initializing Supabase client with URL:', supabaseUrl)

export const supabase = createClient(supabaseUrl, supabaseKey)
