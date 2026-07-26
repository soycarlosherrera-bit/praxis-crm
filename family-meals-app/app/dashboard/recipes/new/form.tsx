'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { recalculateRecipe } from '@/lib/nutrition'
import RecipeIngredientsEditor from '@/components/RecipeIngredientsEditor'
import type { RecipeIngredientRow, IngredientOption, ProductOption } from '@/components/RecipeIngredientsEditor'
import type { MealType } from '@/lib/types'

interface Props {
  householdId: string
  ingredients: IngredientOption[]
  products: ProductOption[]
}

export default function NewRecipeForm({ householdId, ingredients, products }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    meal_type: 'almuerzo' as MealType,
    servings: '4',
    prep_time_min: '',
    instructions: '',
    notes: '',
  })
  const [rows, setRows] = useState<RecipeIngredientRow[]>(
    ingredients.length ? [{ ingredient_id: ingredients[0].id, quantity: '', preferred_product_id: '' }] : []
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        household_id: householdId,
        name: form.name,
        meal_type: form.meal_type,
        servings: Number(form.servings) || 1,
        prep_time_min: form.prep_time_min ? Number(form.prep_time_min) : null,
        instructions: form.instructions || null,
        notes: form.notes || null,
        created_by: user?.id ?? null,
      })
      .select()
      .single()

    if (recipeError || !recipeData) {
      setError(recipeError?.message ?? 'No se pudo crear la receta')
      setLoading(false)
      return
    }

    const validRows = rows.filter(r => r.ingredient_id && r.quantity)
    if (validRows.length > 0) {
      const ingredientMap = new Map(ingredients.map(i => [i.id, i]))
      const { error: riError } = await supabase.from('recipe_ingredients').insert(
        validRows.map(r => ({
          recipe_id: recipeData.id,
          ingredient_id: r.ingredient_id,
          preferred_product_id: r.preferred_product_id || null,
          quantity: Number(r.quantity),
          unit: ingredientMap.get(r.ingredient_id)?.unit_base ?? 'g',
        }))
      )

      if (riError) {
        setError(riError.message)
        setLoading(false)
        return
      }
    }

    await recalculateRecipe(supabase, recipeData.id, householdId)

    router.push('/dashboard/recipes')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4">
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Nueva receta</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tiempo de comida</label>
            <select
              value={form.meal_type}
              onChange={e => setForm(f => ({ ...f, meal_type: e.target.value as MealType }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="desayuno">Desayuno</option>
              <option value="almuerzo">Almuerzo</option>
              <option value="cena">Cena</option>
              <option value="refaccion">Refacción</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Porciones</label>
            <input
              type="number"
              min={1}
              value={form.servings}
              onChange={e => setForm(f => ({ ...f, servings: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prep. (min)</label>
            <input
              type="number"
              min={0}
              value={form.prep_time_min}
              onChange={e => setForm(f => ({ ...f, prep_time_min: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Ingredientes</label>
          <RecipeIngredientsEditor
            ingredients={ingredients}
            products={products}
            rows={rows}
            onChange={setRows}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Instrucciones</label>
          <textarea
            value={form.instructions}
            onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
            rows={4}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {loading ? 'Guardando...' : 'Crear receta'}
          </button>
        </div>
      </form>
    </div>
  )
}
