import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EditRecipeForm from './form'

export default async function EditRecipePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!recipe) notFound()

  const { data: recipeIngredients } = await supabase
    .from('recipe_ingredients')
    .select('*')
    .eq('recipe_id', params.id)

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, name, unit_base')
    .eq('household_id', recipe.household_id)
    .order('name', { ascending: true })

  const { data: products } = await supabase
    .from('products')
    .select('id, ingredient_id, brand')
    .eq('household_id', recipe.household_id)
    .order('brand', { ascending: true })

  return (
    <EditRecipeForm
      recipe={recipe}
      recipeIngredients={recipeIngredients ?? []}
      ingredients={ingredients ?? []}
      products={products ?? []}
    />
  )
}
