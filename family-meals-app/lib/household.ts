import { createClient } from '@/lib/supabase/server'
import type { Household } from '@/lib/types'

/** Primer hogar al que el usuario autenticado tiene acceso (o null si no tiene ninguno). */
export async function getPrimaryHousehold(): Promise<Household | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('households')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  return data as Household | null
}
