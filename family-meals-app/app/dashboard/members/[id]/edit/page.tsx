'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import HealthProfileFields from '@/components/HealthProfileFields'
import { EMPTY_HEALTH_FORM, healthProfileToForm, healthFormToPayload } from '@/lib/health-form'
import type { HealthFormState } from '@/lib/health-form'
import type { HealthProfile } from '@/lib/types'

export default function EditMemberPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [member, setMember] = useState({
    full_name: '',
    birth_date: '',
    relationship: '',
    notes: '',
  })
  const [healthEnabled, setHealthEnabled] = useState(false)
  const [health, setHealth] = useState<HealthFormState>(EMPTY_HEALTH_FORM)
  const [hadHealthProfile, setHadHealthProfile] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: memberData } = await supabase
        .from('household_members')
        .select('*')
        .eq('id', params.id)
        .single()

      if (memberData) {
        setMember({
          full_name: memberData.full_name,
          birth_date: memberData.birth_date ?? '',
          relationship: memberData.relationship ?? '',
          notes: memberData.notes ?? '',
        })
      }

      const { data: healthData } = await supabase
        .from('health_profiles')
        .select('*')
        .eq('member_id', params.id)
        .maybeSingle()

      if (healthData) {
        setHealthEnabled(true)
        setHadHealthProfile(true)
        setHealth(healthProfileToForm(healthData as HealthProfile))
      }

      setFetching(false)
    }
    load()
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: memberError } = await supabase
      .from('household_members')
      .update({
        full_name: member.full_name,
        birth_date: member.birth_date || null,
        relationship: member.relationship || null,
        notes: member.notes || null,
      })
      .eq('id', params.id)

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    if (healthEnabled) {
      const { error: healthError } = await supabase
        .from('health_profiles')
        .upsert(healthFormToPayload(params.id, health), { onConflict: 'member_id' })

      if (healthError) {
        setError(healthError.message)
        setLoading(false)
        return
      }
    } else if (hadHealthProfile) {
      await supabase.from('health_profiles').delete().eq('member_id', params.id)
    }

    router.push('/dashboard/members')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar a "${member.full_name}"? Esta acción es irreversible.`)) return
    await supabase.from('household_members').delete().eq('id', params.id)
    router.push('/dashboard/members')
    router.refresh()
  }

  if (fetching) return <div className="p-6 text-slate-400 text-sm">Cargando...</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4">
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Editar miembro</h1>
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
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      <div className="mt-6 bg-white rounded-2xl border border-red-200 p-6">
        <h2 className="font-semibold text-red-700 mb-2">Zona de peligro</h2>
        <p className="text-sm text-slate-500 mb-4">
          Eliminar a este miembro también borrará su perfil de salud.
        </p>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Eliminar miembro
        </button>
      </div>
    </div>
  )
}
