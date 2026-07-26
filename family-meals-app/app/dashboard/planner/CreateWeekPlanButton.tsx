'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CreateWeekPlanButton({ householdId, weekStart }: { householdId: string; weekStart: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    await supabase.from('meal_plans').insert({ household_id: householdId, week_start_date: weekStart })
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
      <p className="text-slate-500 text-sm mb-4">Todavía no tienes un plan para esta semana.</p>
      <button
        onClick={handleCreate}
        disabled={loading}
        className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Creando...' : 'Crear plan de esta semana'}
      </button>
    </div>
  )
}
