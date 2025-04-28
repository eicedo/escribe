import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bsuwoclakhijdyewibak.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzdXdvY2xha2hpamR5ZXdpYmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1OTQ0OTgsImV4cCI6MjA2MTE3MDQ5OH0.dImzY4Nlam4IVtk8CDZAxdN8EvrCIhEbbUBHqOSkaPc'

export const supabase = createClient(supabaseUrl, supabaseKey)
