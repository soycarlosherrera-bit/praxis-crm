'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import HealthProfileFields from '@/components/HealthProfileFields'
import { EMPTY_HEALTH_FORM, healthFormToPayload } from '@/lib/health-form'
import type { HealthFormState } from '@/lib/health-form'

export default function NewMemberForm({ householdId }: { householdId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [member, setMember] = useState({
    full_name: '',
    birth_date: '',
    relationship: '',
    notes: '',
  })
  const [healthEnabled, setHealthEnabled] = useState(false)
  const [health, setHealth] = useState<HealthFormState>(EMPTY_HEALTH_FORM)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: memberData, error: memberError } = await supabase
      .from('household_members')
      .insert({
        household_id: householdId,
        full_name: member.full_name,
        birth_date: member.birth_date || null,
        relationship: member.relationship || null,
        notes: member.notes || null,
      })
      .select()
      .single()

    if (memberError || !memberData) {
      setError(memberError?.message ?? 'No se pudo crear el miembro')
      setLoading(false)
      return
    }

    if (healthEnabled) {
      const { error: healthError } = await supabase
        .from('health_profiles')
        .insert(healthFormToPayload(memberData.id, health))

      if (healthError) {
        setError(healthError.message)
        setLoading(false)
        return
      }
    }

    router.push('/dashboard/members')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4">
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Agregar miembro de la familia</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo *</label>
          <input
            type="text"
            value={member.full_name}
            onChange={e => setMember(m => ({ ...m, full_name: e.target.value }))}
            required
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de nacimiento</label>
            <input
              type="date"
              value={member.birth_date}
              onChange={e => setMember(m => ({ ...m, birth_date: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parentesco</label>
            <input
              type="text"
              value={member.relationship}
              onChange={e => setMember(m => ({ ...m, relationship: e.target.value }))}
              placeholder="ej. abuelo, papá"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
          <textarea
            value={member.notes}
            onChange={e => setMember(m => ({ ...m, notes: e.target.value }))}
            rows={2}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={healthEnabled}
            onChange={e => setHealthEnabled(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Registrar perfil de salud
        </label>

        {healthEnabled && (
          <div className="border-t border-slate-100 pt-4">
            <HealthProfileFields value={health} onChange={setHealth} />
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
            {loading ? 'Guardando...' : 'Agregar miembro'}
          </button>
        </div>
      </form>
    </div>
  )
}
