import { createClient } from '@supabase/supabase-js'


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cxqxzmcvzzwtqkqoyuti.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'REMOVED_CREDENTIAL'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key must be provided as environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseKey) 