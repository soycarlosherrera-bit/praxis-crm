'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TASK_STATUS_LABELS } from '@/lib/types'
import type { Task, TaskStatus, Priority } from '@/lib/types'

interface Props {
  projectId: string
  tasks: Task[]
  currentUserId: string
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending:     'bg-slate-100 text-slate-600',
  in_progress: 'bg-amber-100 text-amber-700',
  done:        'bg-emerald-100 text-emerald-700',
}

const PRIORITY_COLORS: Record<Priority, string> = {
  low:    'text-slate-400',
  medium: 'text-amber-500',
  high:   'text-red-500',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta',
}

export default function TaskSection({ projectId, tasks: initial, currentUserId }: Props) {
  const supabase = createClient()
  const [tasks, setTasks] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' as Priority, due_date: '' })
  const [posting, setPosting] = useState(false)
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setPosting(true)
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: projectId,
        created_by: currentUserId,
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        due_date: form.due_date || null,
      })
      .select()
      .single()
    if (!error && data) {
      setTasks(prev => [...prev, data as Task])
      setForm({ title: '', description: '', priority: 'medium', due_date: '' })
      setShowForm(false)
    }
    setPosting(false)
  }

  async function handleStatusChange(id: string, status: TaskStatus) {
    await supabase.from('tasks').update({ status }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  async function handleDelete(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800">✅ Tareas</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Nueva tarea
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 mb-4">
        {(['all', 'pending', 'in_progress', 'done'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
              filter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s === 'all' ? `Todo (${counts.all})` : `${TASK_STATUS_LABELS[s]} (${counts[s]})`}
          </button>
        ))}
      </div>

      {/* Form nueva tarea */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3 animate-fade-in">
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Título de la tarea *"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descripción (opcional)"
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <div className="flex gap-3">
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">Prioridad baja</option>
              <option value="medium">Prioridad media</option>
              <option value="high">Prioridad alta</option>
            </select>
            <input
              type="datetime-local"
              value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5">
              Cancelar
            </button>
            <button type="submit" disabled={posting}
              className="text-sm px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {posting ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de tareas */}
      {filtered.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <p className="text-sm">Sin tareas en este estado</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(task => {
          const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
          return (
            <div
              key={task.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                task.status === 'done' ? 'opacity-60 border-slate-100' : 'border-slate-200 hover:border-indigo-200'
              }`}
            >
              {/* Checkbox visual */}
              <button
                onClick={() => handleStatusChange(
                  task.id,
                  task.status === 'done' ? 'pending' : task.status === 'pending' ? 'in_progress' : 'done'
                )}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  task.status === 'done'
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : task.status === 'in_progress'
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-slate-300'
                }`}
              >
                {task.status === 'done' && <span className="text-xs">✓</span>}
                {task.status === 'in_progress' && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority as Priority]}`}>
                    ● {PRIORITY_LABELS[task.priority as Priority]}
                  </span>
                  {task.due_date && (
                    <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                      {isOverdue ? '⚠️ ' : '📅 '}
                      {new Date(task.due_date).toLocaleDateString('es-MX', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
              </div>

              <select
                value={task.status}
                onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${STATUS_COLORS[task.status as TaskStatus]}`}
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En progreso</option>
                <option value="done">Hecho</option>
              </select>

              <button
                onClick={() => handleDelete(task.id)}
                className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
