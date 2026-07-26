import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPrimaryHousehold } from '@/lib/household'
import NewIngredientForm from './form'

export default async function NewIngredientPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const household = await getPrimaryHousehold()
  if (!household) redirect('/households/new')

  return <NewIngredientForm householdId={household.id} />
}
