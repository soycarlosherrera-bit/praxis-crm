'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const COLORS = ['#6366f1', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#0ea5e9', '#f97316', '#ec4899']
const ICONS = ['📁', '💼', '🚀', '🌱', '💡', '🎯', '🏗️', '📚', '🎮', '✨', '❤️', '🤝', '🍕', '🌍']

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    icon: '📁',
    status: 'active',
  })

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single()
      if (data) {
        setForm({
          name: data.name,
          description: data.description ?? '',
          color: data.color,
          icon: data.icon,
          status: data.status,
        })
      }
      setFetching(false)
    }
    load()
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase
      .from('projects')
      .update(form)
      .eq('id', params.id)
    setLoading(false)
    router.push(`/projects/${params.id}`)
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar el proyecto "${form.name}"? Esta acción es irreversible.`)) return
    await supabase.from('projects').delete().eq('id', params.id)
    router.push('/projects')
  }

  if (fetching) return <div className="p-6 text-slate-400 text-sm">Cargando...</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4">
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Editar proyecto</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        {/* Preview */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${form.color}18` }}
          >
            {form.icon}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{form.name || 'Nombre del proyecto'}</h3>
            <p className="text-sm text-slate-500">{form.description || 'Descripción'}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Ícono</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(icon => (
              <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border-2 transition-all ${form.icon === icon ? 'border-indigo-500 bg-indigo-50' : 'border-transparent hover:border-slate-300'}`}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
          <div className="flex gap-2">
            {COLORS.map(color => (
              <button key={color} type="button" onClick={() => setForm(f => ({ ...f, color }))}
                className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === color ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
          <select
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="active">Activo</option>
            <option value="paused">Pausado</option>
            <option value="completed">Completado</option>
            <option value="archived">Archivado</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      {/* Zona de peligro */}
      <div className="mt-6 bg-white rounded-2xl border border-red-200 p-6">
        <h2 className="font-semibold text-red-700 mb-2">Zona de peligro</h2>
        <p className="text-sm text-slate-500 mb-4">Eliminar el proyecto borrará también todas sus tareas, contactos y observaciones.</p>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Eliminar proyecto
        </button>
      </div>
    </div>
  )
}
