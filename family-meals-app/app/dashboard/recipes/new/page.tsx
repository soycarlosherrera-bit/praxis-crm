import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPrimaryHousehold } from '@/lib/household'
import NewRecipeForm from './form'

export default async function NewRecipePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const household = await getPrimaryHousehold()
  if (!household) redirect('/households/new')

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, name, unit_base')
    .eq('household_id', household.id)
    .order('name', { ascending: true })

  const { data: products } = await supabase
    .from('products')
    .select('id, ingredient_id, brand')
    .eq('household_id', household.id)
    .order('brand', { ascending: true })

  return (
    <NewRecipeForm
      householdId={household.id}
      ingredients={ingredients ?? []}
      products={products ?? []}
    />
  )
}
