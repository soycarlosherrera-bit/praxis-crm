'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NutritionFields from '@/components/NutritionFields'
import { EMPTY_NUTRITION_FORM, nutritionFormToPayload } from '@/lib/ingredient-form'
import type { NutritionFormState } from '@/lib/ingredient-form'
import type { IngredientCategory } from '@/lib/types'

const UNIT_SUGGESTIONS = ['g', 'kg', 'ml', 'l', 'unidad', 'taza', 'cucharada']

export default function NewIngredientForm({ householdId }: { householdId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    category: 'otro' as IngredientCategory,
    unit_base: 'g',
    notes: '',
  })
  const [nutritionEnabled, setNutritionEnabled] = useState(false)
  const [nutrition, setNutrition] = useState<NutritionFormState>(EMPTY_NUTRITION_FORM)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: ingredientData, error: ingredientError } = await supabase
      .from('ingredients')
      .insert({
        household_id: householdId,
        name: form.name,
        category: form.category,
        unit_base: form.unit_base,
        notes: form.notes || null,
      })
      .select()
      .single()

    if (ingredientError || !ingredientData) {
      setError(ingredientError?.message ?? 'No se pudo crear el ingrediente')
      setLoading(false)
      return
    }

    if (nutritionEnabled) {
      const { error: nutritionError } = await supabase
        .from('ingredient_nutrition')
        .insert(nutritionFormToPayload(ingredientData.id, nutrition))

      if (nutritionError) {
        setError(nutritionError.message)
        setLoading(false)
        return
      }
    }

    router.push('/dashboard/recipes/ingredients')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4">
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo ingrediente</h1>
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as IngredientCategory }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="proteina">Proteína</option>
              <option value="verdura">Verdura</option>
              <option value="fruta">Fruta</option>
              <option value="cereal">Cereal</option>
              <option value="lacteo">Lácteo</option>
              <option value="grasa">Grasa</option>
              <option value="condimento">Condimento</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unidad base</label>
            <input
              type="text"
              list="unit-suggestions"
              value={form.unit_base}
              onChange={e => setForm(f => ({ ...f, unit_base: e.target.value }))}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <datalist id="unit-suggestions">
              {UNIT_SUGGESTIONS.map(u => <option key={u} value={u} />)}
            </datalist>
          </div>
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

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={nutritionEnabled}
            onChange={e => setNutritionEnabled(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Registrar información nutricional
        </label>

        {nutritionEnabled && (
          <div className="border-t border-slate-100 pt-4">
            <NutritionFields value={nutrition} onChange={setNutrition} unitBase={form.unit_base} />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {loading ? 'Guardando...' : 'Crear ingrediente'}
          </button>
        </div>
      </form>
    </div>
  )
}
