import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPrimaryHousehold } from '@/lib/household'
import { MEAL_TYPE_LABELS, SUITABILITY_COLORS, SUITABILITY_LABELS } from '@/lib/types'
import type { Recipe, RecipeNutritionCache, RecipeSuitability, HouseholdMember, HealthProfile } from '@/lib/types'

export default async function RecipesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const household = await getPrimaryHousehold()
  if (!household) redirect('/households/new')

  const { data: members } = await supabase
    .from('household_members')
    .select('id, full_name, health_profiles(*)')
    .eq('household_id', household.id)

  const membersWithHealth = ((members ?? []) as (HouseholdMember & { health_profiles: HealthProfile[] })[])
    .filter(m => m.health_profiles?.length)

  const { data: recipes } = await supabase
    .from('recipes')
    .select('*, recipe_nutrition_cache(*)')
    .eq('household_id', household.id)
    .order('meal_type', { ascending: true })
    .order('name', { ascending: true })

  const rows = (recipes ?? []) as (Recipe & { recipe_nutrition_cache: RecipeNutritionCache[] })[]

  const recipeIds = rows.map(r => r.id)
  const { data: suitabilityRows } = recipeIds.length
    ? await supabase.from('recipe_suitability').select('*').in('recipe_id', recipeIds)
    : { data: [] as RecipeSuitability[] }

  const suitabilityMap = new Map<string, RecipeSuitability[]>()
  for (const s of (suitabilityRows ?? []) as RecipeSuitability[]) {
    const list = suitabilityMap.get(s.recipe_id) ?? []
    list.push(s)
    suitabilityMap.set(s.recipe_id, list)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-slate-900">Recetario</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/recipes/ingredients"
            className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Ingredientes
          </Link>
          <Link
            href="/dashboard/recipes/new"
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            + Nueva receta
          </Link>
        </div>
      </div>
      <p className="text-slate-500 text-sm mb-8">
        Recetas de desayuno, almuerzo, cena y refacción, con costo estimado y aptitud por miembro.
      </p>

      {membersWithHealth.length > 0 && (
        <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
          <span>Aptitud:</span>
          {membersWithHealth.map(m => (
            <span key={m.id} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              {m.full_name}
            </span>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
          Aún no has agregado recetas.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(recipe => {
            const nutrition = recipe.recipe_nutrition_cache?.[0]
            const suitability = suitabilityMap.get(recipe.id) ?? []
            return (
              <Link
                key={recipe.id}
                href={`/dashboard/recipes/${recipe.id}/edit`}
                className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-300 hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800">{recipe.name}</p>
                  <p className="text-xs text-slate-400">
                    {MEAL_TYPE_LABELS[recipe.meal_type]} · {recipe.servings} porciones
                    {nutrition?.cost_estimate != null && ` · ~Q${nutrition.cost_estimate.toFixed(2)}/porción`}
                  </p>
                </div>
                {membersWithHealth.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {membersWithHealth.map(m => {
                      const s = suitability.find(x => x.member_id === m.id)
                      const color = s ? SUITABILITY_COLORS[s.status] : '#cbd5e1'
                      const label = s ? SUITABILITY_LABELS[s.status] : 'Sin calcular'
                      return (
                        <span
                          key={m.id}
                          title={`${m.full_name}: ${label}${s?.reason ? ` — ${s.reason}` : ''}`}
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      )
                    })}
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
