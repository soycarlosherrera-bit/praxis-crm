import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPrimaryHousehold } from '@/lib/household'
import { HEALTH_CONDITION_LABELS } from '@/lib/types'
import type { HouseholdMember, HealthProfile, HealthCondition } from '@/lib/types'

const CONDITION_COLORS: Record<HealthCondition, string> = {
  ninguna: 'bg-slate-100 text-slate-500',
  erc: 'bg-red-100 text-red-700',
  adulto_mayor: 'bg-amber-100 text-amber-700',
  otra: 'bg-purple-100 text-purple-700',
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null
  const today = new Date()
  const dob = new Date(birthDate)
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const household = await getPrimaryHousehold()
  if (!household) redirect('/households/new')

  const { data: members } = await supabase
    .from('household_members')
    .select('*, health_profiles(*)')
    .eq('household_id', household.id)
    .order('created_at', { ascending: true })

  const rows = (members ?? []) as (HouseholdMember & { health_profiles: HealthProfile[] })[]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-slate-900">Familia y salud</h1>
        <Link
          href="/dashboard/members/new"
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          + Agregar miembro
        </Link>
      </div>
      <p className="text-slate-500 text-sm mb-8">
        Miembros del hogar y sus perfiles de salud (condición, restricciones y textura).
      </p>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
          Aún no has agregado a nadie de la familia.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(member => {
            const health = member.health_profiles?.[0]
            const age = calculateAge(member.birth_date)
            return (
              <Link
                key={member.id}
                href={`/dashboard/members/${member.id}/edit`}
                className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-300 hover:shadow-sm transition-all"
              >
                <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600 flex-shrink-0">
                  {member.full_name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800">{member.full_name}</p>
                  <p className="text-xs text-slate-400">
                    {[member.relationship, age !== null ? `${age} años` : null].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {health && health.condition !== 'ninguna' && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${CONDITION_COLORS[health.condition]}`}>
                    {HEALTH_CONDITION_LABELS[health.condition]}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
