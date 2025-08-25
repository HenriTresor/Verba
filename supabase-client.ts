import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://kmjaytgghwsamalmnnpr.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttamF5dGdnaHdzYW1hbG1ubnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjczNDgsImV4cCI6MjA3MDM0MzM0OH0.hJHuwFr3Ca7nXzY7mb9lMtFC-zUPBWm_5FHg1BQY46k"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
})