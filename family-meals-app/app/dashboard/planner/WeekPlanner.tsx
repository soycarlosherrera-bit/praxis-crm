'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { weekDays, formatShort } from '@/lib/dates'
import { MEAL_TYPE_LABELS, SUITABILITY_COLORS, SUITABILITY_LABELS } from '@/lib/types'
import type { MealType, SuitabilityStatus } from '@/lib/types'

export interface RecipeOption {
  id: string
  name: string
  meal_type: MealType
  servings: number
  cost_estimate: number | null
}

export interface MemberOption {
  id: string
  full_name: string
}

export interface SuitabilityInfo {
  member_id: string
  status: SuitabilityStatus
  reason: string | null
}

export interface PlannerEntry {
  id: string
  date: string
  meal_type: MealType
  recipe_id: string
  servings_planned: number
  cooked: boolean
}

interface Props {
  planId: string
  weekStart: string
  budgetTarget: number | null
  entries: PlannerEntry[]
  recipes: RecipeOption[]
  members: MemberOption[]
  suitabilityMap: Record<string, SuitabilityInfo[]>
}

const MEAL_TYPES: MealType[] = ['desayuno', 'almuerzo', 'cena', 'refaccion']

function worstStatus(statuses: SuitabilityStatus[]): SuitabilityStatus | null {
  if (statuses.includes('evitar')) return 'evitar'
  if (statuses.includes('precaucion')) return 'precaucion'
  if (statuses.includes('apto')) return 'apto'
  return null
}

export default function WeekPlanner({ planId, weekStart, budgetTarget: initialBudget, entries: initialEntries, recipes, members, suitabilityMap }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const days = weekDays(weekStart)

  const [entries, setEntries] = useState(initialEntries)
  const [budgetTarget, setBudgetTarget] = useState(initialBudget?.toString() ?? '')
  const [addingCell, setAddingCell] = useState<{ date: string; mealType: MealType } | null>(null)
  const [newRecipeId, setNewRecipeId] = useState('')
  const [newServings, setNewServings] = useState('')

  const recipeMap = new Map(recipes.map(r => [r.id, r]))

  function openAdd(date: string, mealType: MealType) {
    const defaultRecipe = recipes.find(r => r.meal_type === mealType) ?? recipes[0]
    setNewRecipeId(defaultRecipe?.id ?? '')
    setNewServings(defaultRecipe?.servings?.toString() ?? '1')
    setAddingCell({ date, mealType })
  }

  async function handleAdd() {
    if (!newRecipeId || !addingCell) return
    const { data, error } = await supabase
      .from('meal_plan_entries')
      .insert({
        plan_id: planId,
        date: addingCell.date,
        meal_type: addingCell.mealType,
        recipe_id: newRecipeId,
        servings_planned: Number(newServings) || 1,
      })
      .select()
      .single()

    if (!error && data) {
      setEntries(prev => [...prev, data as PlannerEntry])
      setAddingCell(null)
    }
  }

  async function handleRemove(entryId: string) {
    await supabase.from('meal_plan_entries').delete().eq('id', entryId)
    setEntries(prev => prev.filter(e => e.id !== entryId))
  }

  async function handleToggleCooked(entry: PlannerEntry) {
    const cooked = !entry.cooked
    await supabase.from('meal_plan_entries').update({ cooked }).eq('id', entry.id)
    setEntries(prev => prev.map(e => (e.id === entry.id ? { ...e, cooked } : e)))
  }

  async function handleBudgetBlur() {
    const value = budgetTarget.trim() === '' ? null : Number(budgetTarget)
    await supabase.from('meal_plans').update({ budget_target: value }).eq('id', planId)
    router.refresh()
  }

  const weekCost = entries.reduce((sum, e) => {
    const recipe = recipeMap.get(e.recipe_id)
    if (!recipe?.cost_estimate) return sum
    return sum + recipe.cost_estimate * e.servings_planned
  }, 0)

  const budgetNumber = budgetTarget.trim() === '' ? null : Number(budgetTarget)
  const overBudget = budgetNumber != null && weekCost > budgetNumber

  return (
    <div>
      <div className="flex items-center justify-between mb-4 bg-white rounded-xl border border-slate-200 p-4">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Presupuesto de la semana (Q)</label>
          <input
            type="number"
            value={budgetTarget}
            onChange={e => setBudgetTarget(e.target.value)}
            onBlur={handleBudgetBlur}
            placeholder="Sin definir"
            className="w-32 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Costo estimado</p>
          <p className={`text-lg font-bold ${overBudget ? 'text-red-600' : 'text-slate-800'}`}>
            Q{weekCost.toFixed(2)}
          </p>
          {overBudget && <p className="text-xs text-red-500">Supera el presupuesto</p>}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 min-w-[900px]">
          <thead>
            <tr>
              <th className="w-24" />
              {days.map(d => (
                <th key={d.date} className="text-xs font-semibold text-slate-500 text-left px-2 py-1">
                  {d.label} <span className="font-normal text-slate-400">{formatShort(d.date)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEAL_TYPES.map(mealType => (
              <tr key={mealType}>
                <td className="text-xs font-semibold text-slate-500 align-top pt-2">
                  {MEAL_TYPE_LABELS[mealType]}
                </td>
                {days.map(d => {
                  const cellEntries = entries.filter(e => e.date === d.date && e.meal_type === mealType)
                  const isAdding = addingCell?.date === d.date && addingCell.mealType === mealType
                  return (
                    <td key={d.date} className="align-top bg-white border border-slate-200 rounded-lg p-2 min-w-[140px]">
                      <div className="space-y-1.5">
                        {cellEntries.map(entry => {
                          const recipe = recipeMap.get(entry.recipe_id)
                          const statuses = (suitabilityMap[entry.recipe_id] ?? [])
                            .filter(s => members.some(m => m.id === s.member_id))
                          const worst = worstStatus(statuses.map(s => s.status))
                          return (
                            <div key={entry.id} className="bg-slate-50 rounded-lg p-2 text-xs">
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-medium text-slate-700">{recipe?.name ?? '—'}</span>
                                <button onClick={() => handleRemove(entry.id)} className="text-slate-300 hover:text-red-400 leading-none">×</button>
                              </div>
                              <div className="flex items-center justify-between mt-1 text-slate-400">
                                <label className="flex items-center gap-1">
                                  <input type="checkbox" checked={entry.cooked} onChange={() => handleToggleCooked(entry)} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                  Hecho
                                </label>
                                {worst && worst !== 'apto' && (
                                  <span
                                    title={statuses.map(s => `${members.find(m => m.id === s.member_id)?.full_name}: ${SUITABILITY_LABELS[s.status]}${s.reason ? ` — ${s.reason}` : ''}`).join(' · ')}
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: SUITABILITY_COLORS[worst] }}
                                  />
                                )}
                              </div>
                            </div>
                          )
                        })}

                        {isAdding ? (
                          <div className="bg-slate-50 rounded-lg p-2 space-y-1.5">
                            <select
                              value={newRecipeId}
                              onChange={e => setNewRecipeId(e.target.value)}
                              className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs"
                            >
                              {recipes.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min={1}
                              value={newServings}
                              onChange={e => setNewServings(e.target.value)}
                              placeholder="Porciones"
                              className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs"
                            />
                            <div className="flex gap-1">
                              <button onClick={() => setAddingCell(null)} className="flex-1 text-xs text-slate-500 hover:text-slate-700">Cancelar</button>
                              <button onClick={handleAdd} className="flex-1 text-xs bg-emerald-600 text-white rounded py-1 hover:bg-emerald-700">Agregar</button>
                            </div>
                          </div>
                        ) : (
                          recipes.length > 0 && (
                            <button
                              onClick={() => openAdd(d.date, mealType)}
                              className="w-full text-xs text-emerald-600 hover:underline py-1"
                            >
                              + Agregar
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
