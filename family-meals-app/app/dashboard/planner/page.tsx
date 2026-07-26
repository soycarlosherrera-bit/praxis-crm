import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPrimaryHousehold } from '@/lib/household'
import { getMondayISO, addDaysISO, formatShort } from '@/lib/dates'
import CreateWeekPlanButton from './CreateWeekPlanButton'
import WeekPlanner from './WeekPlanner'
import type { RecipeOption, MemberOption, SuitabilityInfo, PlannerEntry } from './WeekPlanner'
import type { HouseholdMember, HealthProfile, Recipe, RecipeNutritionCache, RecipeSuitability } from '@/lib/types'

export default async function PlannerPage({ searchParams }: { searchParams: { week?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const household = await getPrimaryHousehold()
  if (!household) redirect('/households/new')

  const weekStart = searchParams.week ?? getMondayISO(new Date())
  const prevWeek = addDaysISO(weekStart, -7)
  const nextWeek = addDaysISO(weekStart, 7)
  const weekEnd = addDaysISO(weekStart, 6)

  const { data: plan } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('household_id', household.id)
    .eq('week_start_date', weekStart)
    .maybeSingle()

  const { data: recipesData } = await supabase
    .from('recipes')
    .select('*, recipe_nutrition_cache(*)')
    .eq('household_id', household.id)
    .order('name', { ascending: true })

  const rows = (recipesData ?? []) as (Recipe & { recipe_nutrition_cache: RecipeNutritionCache[] })[]
  const recipeIds = rows.map(r => r.id)

  const { data: suitabilityRows } = recipeIds.length
    ? await supabase.from('recipe_suitability').select('*').in('recipe_id', recipeIds)
    : { data: [] as RecipeSuitability[] }

  const { data: members } = await supabase
    .from('household_members')
    .select('id, full_name, health_profiles(*)')
    .eq('household_id', household.id)

  const membersWithHealth = ((members ?? []) as (HouseholdMember & { health_profiles: HealthProfile[] })[])
    .filter(m => m.health_profiles?.length)
    .map(m => ({ id: m.id, full_name: m.full_name })) as MemberOption[]

  const suitabilityMap: Record<string, SuitabilityInfo[]> = {}
  for (const s of (suitabilityRows ?? []) as RecipeSuitability[]) {
    if (!suitabilityMap[s.recipe_id]) suitabilityMap[s.recipe_id] = []
    suitabilityMap[s.recipe_id].push({ member_id: s.member_id, status: s.status, reason: s.reason })
  }

  const recipeOptions: RecipeOption[] = rows.map(r => ({
    id: r.id,
    name: r.name,
    meal_type: r.meal_type,
    servings: r.servings,
    cost_estimate: r.recipe_nutrition_cache?.[0]?.cost_estimate ?? null,
  }))

  let entries: PlannerEntry[] = []
  if (plan) {
    const { data: entryRows } = await supabase
      .from('meal_plan_entries')
      .select('*')
      .eq('plan_id', plan.id)
    entries = (entryRows ?? []) as PlannerEntry[]
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-slate-900">Planificador semanal</h1>
      </div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-500 text-sm">{formatShort(weekStart)} – {formatShort(weekEnd)}</p>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/planner?week=${prevWeek}`} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            ← Semana anterior
          </Link>
          <Link href={`/dashboard/planner?week=${nextWeek}`} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            Semana siguiente →
          </Link>
        </div>
      </div>

      {recipeOptions.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 mb-6">
          Aún no tienes recetas. <Link href="/dashboard/recipes/new" className="underline">Crea tu primera receta</Link> antes de planificar la semana.
        </div>
      )}

      {!plan ? (
        <CreateWeekPlanButton householdId={household.id} weekStart={weekStart} />
      ) : (
        <WeekPlanner
          planId={plan.id}
          weekStart={weekStart}
          budgetTarget={plan.budget_target}
          entries={entries}
          recipes={recipeOptions}
          members={membersWithHealth}
          suitabilityMap={suitabilityMap}
        />
      )}
    </div>
  )
}
