export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { STATUS_LABELS, PRAXIS_LABELS, PRAXIS_COLORS, PRAXIS_ICONS } from '@/lib/types'
import type { ProjectWithScores, ProjectStatus, PraxisDimension } from '@/lib/types'
import DeleteProjectButton from '@/components/DeleteProjectButton'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*, praxis_scores(*), owner:profiles!owner_id(full_name)')
    .order('updated_at', { ascending: false })

  const all = projects as ProjectWithScores[] ?? []

  const byStatus = {
    active:    all.filter(p => p.status === 'active'),
    paused:    all.filter(p => p.status === 'paused'),
    completed: all.filter(p => p.status === 'completed'),
    archived:  all.filter(p => p.status === 'archived'),
  }

  const statusColors: Record<ProjectStatus, string> = {
    active:    'bg-emerald-100 text-emerald-700',
    paused:    'bg-amber-100 text-amber-700',
    completed: 'bg-blue-100 text-blue-700',
    archived:  'bg-slate-100 text-slate-500',
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proyectos</h1>
          <p className="text-slate-500 text-sm mt-0.5">{all.length} proyecto{all.length !== 1 ? 's' : ''} en total</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Nuevo proyecto
        </Link>
      </div>

      {all.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-4">📁</div>
          <h2 className="text-lg font-medium text-slate-600">Sin proyectos aún</h2>
          <p className="text-sm mt-1">Crea tu primer proyecto para empezar</p>
          <Link href="/projects/new" className="mt-4 inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700">
            Crear proyecto
          </Link>
        </div>
      )}

      {(Object.entries(byStatus) as [ProjectStatus, ProjectWithScores[]][])
        .filter(([, list]) => list.length > 0)
        .map(([status, list]) => (
          <section key={status} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[status]}`}>
                {STATUS_LABELS[status]}
              </span>
              <span className="text-xs text-slate-400">{list.length}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map(project => {
                const avgScore = project.praxis_scores?.length
                  ? Math.round(project.praxis_scores.reduce((s, p) => s + p.score, 0) / project.praxis_scores.length)
                  : 0
                const isOwner = project.owner_id === user.id

                return (
                  <div
                    key={project.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all group"
                  >
                    <Link href={`/projects/${project.id}`} className="block p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ backgroundColor: `${project.color}18` }}
                        >
                          {project.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">{project.name}</h3>
                          {project.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{project.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Mini barras PRAXIS */}
                      <div className="space-y-1.5 mb-4">
                        {project.praxis_scores?.map(s => (
                          <div key={s.dimension} className="flex items-center gap-2">
                            <span className="text-xs w-3">{PRAXIS_ICONS[s.dimension as PraxisDimension]}</span>
                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${s.score}%`, backgroundColor: PRAXIS_COLORS[s.dimension as PraxisDimension] }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 w-7 text-right">{s.score}%</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          Actualizado {new Date(project.updated_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-sm font-bold" style={{ color: project.color }}>{avgScore}%</span>
                      </div>
                    </Link>

                    {isOwner && (
                      <div className="border-t border-slate-100 px-5 py-2.5 flex items-center gap-3">
                        <Link
                          href={`/projects/${project.id}/edit`}
                          className="text-xs text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                          Editar
                        </Link>
                        <DeleteProjectButton projectId={project.id} projectName={project.name} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
    </div>
  )
}
