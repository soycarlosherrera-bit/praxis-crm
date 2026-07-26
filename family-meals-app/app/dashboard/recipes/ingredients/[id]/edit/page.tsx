'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NutritionFields from '@/components/NutritionFields'
import { EMPTY_NUTRITION_FORM, nutritionToForm, nutritionFormToPayload } from '@/lib/ingredient-form'
import type { NutritionFormState } from '@/lib/ingredient-form'
import type { IngredientCategory, IngredientNutrition } from '@/lib/types'

export default function EditIngredientPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    category: 'otro' as IngredientCategory,
    unit_base: 'g',
    notes: '',
  })
  const [nutritionEnabled, setNutritionEnabled] = useState(false)
  const [nutrition, setNutrition] = useState<NutritionFormState>(EMPTY_NUTRITION_FORM)
  const [hadNutrition, setHadNutrition] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('ingredients')
        .select('*')
        .eq('id', params.id)
        .single()

      if (data) {
        setForm({
          name: data.name,
          category: data.category,
          unit_base: data.unit_base,
          notes: data.notes ?? '',
        })
      }

      const { data: nutritionData } = await supabase
        .from('ingredient_nutrition')
        .select('*')
        .eq('ingredient_id', params.id)
        .maybeSingle()

      if (nutritionData) {
        setNutritionEnabled(true)
        setHadNutrition(true)
        setNutrition(nutritionToForm(nutritionData as IngredientNutrition))
      }

      setFetching(false)
    }
    load()
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: ingredientError } = await supabase
      .from('ingredients')
      .update({
        name: form.name,
        category: form.category,
        unit_base: form.unit_base,
        notes: form.notes || null,
      })
      .eq('id', params.id)

    if (ingredientError) {
      setError(ingredientError.message)
      setLoading(false)
      return
    }

    if (nutritionEnabled) {
      const { error: nutritionError } = await supabase
        .from('ingredient_nutrition')
        .upsert(nutritionFormToPayload(params.id, nutrition), { onConflict: 'ingredient_id' })

      if (nutritionError) {
        setError(nutritionError.message)
        setLoading(false)
        return
      }
    } else if (hadNutrition) {
      await supabase.from('ingredient_nutrition').delete().eq('ingredient_id', params.id)
    }

    router.push('/dashboard/recipes/ingredients')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${form.name}"? También se borrará de las recetas que lo usen.`)) return
    await supabase.from('ingredients').delete().eq('id', params.id)
    router.push('/dashboard/recipes/ingredients')
    router.refresh()
  }

  if (fetching) return <div className="p-6 text-slate-400 text-sm">Cargando...</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4">
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Editar ingrediente</h1>
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
              value={form.unit_base}
              onChange={e => setForm(f => ({ ...f, unit_base: e.target.value }))}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-amber-600 mt-1">
              Cambiarla no actualiza las recetas que ya usan este ingrediente.
            </p>
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
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      <div className="mt-6 bg-white rounded-2xl border border-red-200 p-6">
        <h2 className="font-semibold text-red-700 mb-2">Zona de peligro</h2>
        <p className="text-sm text-slate-500 mb-4">
          Eliminar este ingrediente lo quitará de cualquier receta que lo use.
        </p>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Eliminar ingrediente
        </button>
      </div>
    </div>
  )
}
