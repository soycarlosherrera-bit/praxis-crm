import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Household } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: households } = await supabase
    .from('households')
    .select('*')
    .order('created_at', { ascending: true })

  const myHouseholds = (households as Household[]) ?? []

  if (myHouseholds.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center mt-12">
          <div className="text-4xl mb-3">🏡</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Aún no tienes un hogar</h1>
          <p className="text-slate-500 text-sm mb-6">
            Crea tu hogar para empezar a registrar miembros de la familia, perfiles de salud,
            recetas y tu presupuesto semanal.
          </p>
          <Link
            href="/households/new"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            + Crear mi hogar
          </Link>
        </div>
      </div>
    )
  }

  const household = myHouseholds[0]
  const now = new Date()

  const sections = [
    { href: '/dashboard/members',  icon: '❤️', label: 'Familia y salud', desc: 'Miembros y sus perfiles de salud' },
    { href: '/dashboard/recipes',  icon: '📖', label: 'Recetario',       desc: 'Recetas de desayuno, almuerzo, cena y refacción' },
    { href: '/dashboard/planner',  icon: '🗓️', label: 'Planificador',    desc: 'Menú semanal por día y tiempo de comida' },
    { href: '/dashboard/shopping', icon: '🛒', label: 'Compras',         desc: 'Lista de compras generada desde el plan' },
    { href: '/dashboard/budget',   icon: '💰', label: 'Presupuesto',     desc: 'Costo planeado vs. gasto real' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{household.name}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {now.toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(s => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{s.icon}</div>
              <div>
                <h2 className="font-semibold text-slate-800">{s.label}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{s.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
