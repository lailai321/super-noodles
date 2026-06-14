import { createClient } from '@supabase/supabase-js'

const stripBOM = (s: string) => s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s

const supabaseUrl = stripBOM(process.env.NEXT_PUBLIC_SUPABASE_URL!)
const supabaseAnonKey = stripBOM(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getServiceClient() {
  return createClient(supabaseUrl, stripBOM(process.env.SUPABASE_SERVICE_ROLE_KEY!), {
    auth: { persistSession: false },
  })
}
