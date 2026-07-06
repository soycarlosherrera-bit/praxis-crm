import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { PRAXIS_LABELS, PRAXIS_COLORS, PRAXIS_ICONS, TASK_STATUS_LABELS, CONTACT_STATUS_LABELS } from '@/lib/types'
import type { PraxisDimension, TaskStatus, ContactStatus } from '@/lib/types'
import PraxisSliders from '@/components/PraxisSliders'
import ObservationFeed from '@/components/ObservationFeed'
import TaskSection from '@/components/TaskSection'
import ContactSection from '@/components/ContactSection'
import InviteMember from '@/components/InviteMember'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*, praxis_scores(*), owner:profiles!owner_id(id, full_name, avatar_url)')
    .eq('id', params.id)
    .single()

  if (!project) notFound()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, assignee:profiles!assigned_to(full_name, avatar_url)')
    .eq('project_id', params.id)
    .order('due_date', { ascending: true, nullsFirst: false })

  const { data: observations } = await supabase
    .from('observations')
    .select('*, author:profiles!created_by(full_name, avatar_url)')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  const { data: projectContacts } = await supabase
    .from('project_contacts')
    .select('*, contact:contacts(*)')
    .eq('project_id', params.id)

  const { data: members } = await supabase
    .from('project_members')
    .select('*, profile:profiles!user_id(full_name, avatar_url)')
    .eq('project_id', params.id)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isOwner = project.owner_id === user.id
  const avgScore = project.praxis_scores?.length
    ? Math.round(project.praxis_scores.reduce((s: number, p: any) => s + p.score, 0) / project.praxis_scores.length)
    : 0

  const taskStats = {
    total: tasks?.length ?? 0,
    done: tasks?.filter(t => t.status === 'done').length ?? 0,
    inProgress: tasks?.filter(t => t.status === 'in_progress').length ?? 0,
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header del proyecto */}
      <div className="mb-6">
        <Link href="/projects" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4">
          ← Proyectos
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: `${project.color}18` }}
            >
              {project.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              {project.description && (
                <p className="text-slate-500 text-sm mt-0.5">{project.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {project.status === 'active' ? 'Activo' : project.status}
                </span>
                <span className="text-xs text-slate-400">
                  Por {(project.owner as any)?.full_name ?? 'desconocido'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <Link
                href={`/projects/${project.id}/edit`}
                className="px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Editar
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: project.color }}>{avgScore}%</div>
          <div className="text-xs text-slate-500 mt-0.5">PRAXIS promedio</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">{taskStats.total}</div>
          <div className="text-xs text-slate-500 mt-0.5">Tareas</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{taskStats.done}</div>
          <div className="text-xs text-slate-500 mt-0.5">Completadas</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">{projectContacts?.length ?? 0}</div>
          <div className="text-xs text-slate-500 mt-0.5">Contactos</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="col-span-2 space-y-6">
          {/* Feed de observaciones (tipo Asana) */}
          <ObservationFeed
            projectId={project.id}
            observations={observations ?? []}
            currentUser={profile}
          />

          {/* Tareas */}
          <TaskSection
            projectId={project.id}
            tasks={tasks ?? []}
            currentUserId={user.id}
          />

          {/* Contactos */}
          <ContactSection
            projectId={project.id}
            projectContacts={projectContacts ?? []}
            userId={user.id}
          />
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* PRAXIS Sliders */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              🧭 Dimensiones PRAXIS
            </h2>
            <PraxisSliders
              projectId={project.id}
              scores={project.praxis_scores ?? []}
              canEdit={isOwner || members?.some((m: any) => m.user_id === user.id && m.role === 'editor')}
            />
          </div>

          {/* Miembros */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">👥 Equipo</h2>
            <div className="space-y-2 mb-4">
              {/* Owner */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600">
                  {((project.owner as any)?.full_name ?? 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{(project.owner as any)?.full_name}</p>
                  <p className="text-xs text-slate-400">Dueño</p>
                </div>
              </div>
              {members?.map((m: any) => (
                <div key={m.id} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                    {(m.profile?.full_name ?? 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{m.profile?.full_name}</p>
                    <p className="text-xs text-slate-400">{m.role === 'editor' ? 'Editor' : 'Visor'}</p>
                  </div>
                </div>
              ))}
            </div>
            {isOwner && <InviteMember projectId={project.id} />}
          </div>
        </div>
      </div>
    </div>
  )
}
