import { createClient } from '@supabase/supabase-js'

// Debug environment variables (only in development)
if (import.meta.env.DEV) {
  console.log('Environment variables:', {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    NODE_ENV: import.meta.env.MODE,
  })
}

// Use hardcoded values for development if environment variables are not available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bsuwoclakhijdyewibak.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzdXdvY2xha2hpamR5ZXdpYmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1OTQ0OTgsImV4cCI6MjA2MTE3MDQ5OH0.dImzY4Nlam4IVtk8CDZAxdN8EvrCIhEbbUBHqOSkaPc'

// Only throw errors in production
if (import.meta.env.PROD) {
  if (!supabaseUrl) {
    console.error('VITE_SUPABASE_URL is not defined in environment variables')
    throw new Error('VITE_SUPABASE_URL is required')
  }

  if (!supabaseKey) {
    console.error('VITE_SUPABASE_ANON_KEY is not defined in environment variables')
    throw new Error('VITE_SUPABASE_ANON_KEY is required')
  }
}

console.log('Initializing Supabase client with URL:', supabaseUrl)

export const supabase = createClient(supabaseUrl, supabaseKey)
