/**
 * Supabase client helpers
 * Usage: import { supabase } from '@/lib/supabase'
 *
 * In V1 with mock services, these are not called at runtime.
 * They become active once NEXT_PUBLIC_SUPABASE_URL is set.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://placeholder.supabase.co'
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnon)
