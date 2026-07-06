import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { STATUS_LABELS, PRAXIS_LABELS, PRAXIS_COLORS, PRAXIS_ICONS } from '@/lib/types'
import type { ProjectWithScores, PraxisDimension } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Proyectos con scores
  const { data: projects } = await supabase
    .from('projects')
    .select('*, praxis_scores(*), owner:profiles!owner_id(full_name, avatar_url)')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(6)

  // Tareas próximas a vencer
  const { data: upcomingTasks } = await supabase
    .from('tasks')
    .select('*, project:projects(name, color, icon)')
    .neq('status', 'done')
    .not('due_date', 'is', null)
    .order('due_date', { ascending: true })
    .limit(5)

  const activeProjects = projects as ProjectWithScores[] ?? []

  // Calcular promedio PRAXIS global
  const avgScores: Record<PraxisDimension, number> = {
    trabajo: 0, recreacion: 0, espiritu: 0, educacion: 0, salud: 0
  }
  if (activeProjects.length > 0) {
    activeProjects.forEach(p => {
      p.praxis_scores?.forEach(s => {
        avgScores[s.dimension] += s.score
      })
    })
    const dims = Object.keys(avgScores) as PraxisDimension[]
    dims.forEach(d => { avgScores[d] = Math.round(avgScores[d] / activeProjects.length) })
  }

  const now = new Date()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Nuevo proyecto
        </Link>
      </div>

      {/* PRAXIS Global */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Índice PRAXIS Global
        </h2>
        <div className="grid grid-cols-5 gap-4">
          {(Object.keys(avgScores) as PraxisDimension[]).map(dim => (
            <div key={dim} className="text-center">
              <div className="text-2xl mb-1">{PRAXIS_ICONS[dim]}</div>
              <div className="text-lg font-bold" style={{ color: PRAXIS_COLORS[dim] }}>
                {avgScores[dim]}%
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{PRAXIS_LABELS[dim]}</div>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${avgScores[dim]}%`, backgroundColor: PRAXIS_COLORS[dim] }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-3 gap-6">
        {/* Proyectos activos */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Proyectos activos</h2>
            <Link href="/projects" className="text-sm text-indigo-600 hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
            {activeProjects.length === 0 && (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
                <div className="text-3xl mb-2">📁</div>
                <p className="text-sm">Sin proyectos activos. ¡Crea el primero!</p>
              </div>
            )}
            {activeProjects.map(project => {
              const avgScore = project.praxis_scores?.length
                ? Math.round(project.praxis_scores.reduce((s, p) => s + p.score, 0) / project.praxis_scores.length)
                : 0
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: `${project.color}18` }}
                    >
                      {project.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-slate-900 truncate">{project.name}</h3>
                        <span className="text-sm font-semibold" style={{ color: project.color }}>
                          {avgScore}%
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{project.description}</p>
                      )}
                      <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${avgScore}%`, backgroundColor: project.color }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Tareas próximas */}
        <div>
          <h2 className="font-semibold text-slate-800 mb-4">Próximas tareas</h2>
          <div className="space-y-2">
            {(!upcomingTasks || upcomingTasks.length === 0) && (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-400">
                <div className="text-2xl mb-1">✅</div>
                <p className="text-xs">Sin tareas pendientes</p>
              </div>
            )}
            {upcomingTasks?.map(task => {
              const due = new Date(task.due_date!)
              const isOverdue = due < now
              const isToday = due.toDateString() === now.toDateString()
              return (
                <Link
                  key={task.id}
                  href={`/projects/${task.project_id}`}
                  className="block bg-white rounded-lg border border-slate-200 p-3 hover:border-indigo-300 transition-all"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: (task.project as any)?.color || '#6366f1' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 truncate">{task.title}</p>
                      <p className="text-xs text-slate-400 truncate">{(task.project as any)?.name}</p>
                      <p className={`text-xs font-medium mt-1 ${isOverdue ? 'text-red-500' : isToday ? 'text-amber-500' : 'text-slate-400'}`}>
                        {isOverdue ? '⚠️ Vencida' : isToday ? '📅 Hoy' : due.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
