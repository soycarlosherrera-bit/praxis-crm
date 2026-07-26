import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPrimaryHousehold } from '@/lib/household'
import type { Ingredient, IngredientNutrition, IngredientCategory } from '@/lib/types'

const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  proteina: 'Proteína',
  verdura: 'Verdura',
  fruta: 'Fruta',
  cereal: 'Cereal',
  lacteo: 'Lácteo',
  grasa: 'Grasa',
  condimento: 'Condimento',
  otro: 'Otro',
}

export default async function IngredientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const household = await getPrimaryHousehold()
  if (!household) redirect('/households/new')

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('*, ingredient_nutrition(*)')
    .eq('household_id', household.id)
    .order('name', { ascending: true })

  const rows = (ingredients ?? []) as (Ingredient & { ingredient_nutrition: IngredientNutrition[] })[]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/dashboard/recipes" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4">
        ← Recetario
      </Link>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-slate-900">Ingredientes</h1>
        <Link
          href="/dashboard/recipes/ingredients/new"
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          + Nuevo ingrediente
        </Link>
      </div>
      <p className="text-slate-500 text-sm mb-8">
        Catálogo genérico usado por las recetas, con su información nutricional por 100 unidad base.
      </p>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
          Aún no has agregado ingredientes.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(ingredient => {
            const n = ingredient.ingredient_nutrition?.[0]
            return (
              <Link
                key={ingredient.id}
                href={`/dashboard/recipes/ingredients/${ingredient.id}/edit`}
                className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-300 hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800">{ingredient.name}</p>
                  <p className="text-xs text-slate-400">
                    {CATEGORY_LABELS[ingredient.category]} · por 100 {ingredient.unit_base}
                  </p>
                </div>
                {n && (
                  <div className="text-xs text-slate-500 text-right flex-shrink-0 space-x-2">
                    {n.calories != null && <span>{n.calories} kcal</span>}
                    {n.sodium_mg != null && <span>Na {n.sodium_mg}mg</span>}
                    {n.potassium_mg != null && <span>K {n.potassium_mg}mg</span>}
                    {n.phosphorus_mg != null && <span>P {n.phosphorus_mg}mg</span>}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
