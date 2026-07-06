'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ObservationWithAuthor, Profile } from '@/lib/types'

interface Props {
  projectId: string
  observations: ObservationWithAuthor[]
  currentUser: Profile | null
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
}

export default function ObservationFeed({ projectId, observations: initial, currentUser }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [observations, setObservations] = useState(initial)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  async function handlePost() {
    if (!content.trim() || !currentUser) return
    setPosting(true)
    const { data, error } = await supabase
      .from('observations')
      .insert({ project_id: projectId, content: content.trim(), created_by: currentUser.id })
      .select('*, author:profiles!created_by(full_name, avatar_url)')
      .single()
    if (!error && data) {
      setObservations(prev => [data as ObservationWithAuthor, ...prev])
      setContent('')
    }
    setPosting(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('observations').delete().eq('id', id)
    setObservations(prev => prev.filter(o => o.id !== id))
  }

  async function handleEdit(id: string) {
    await supabase
      .from('observations')
      .update({ content: editContent, is_edited: true })
      .eq('id', id)
    setObservations(prev =>
      prev.map(o => o.id === id ? { ...o, content: editContent, is_edited: true } : o)
    )
    setEditingId(null)
  }

  function startEdit(obs: ObservationWithAuthor) {
    setEditingId(obs.id)
    setEditContent(obs.content)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        📋 Actualizaciones
      </h2>

      {/* Composer */}
      <div className="flex gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600 flex-shrink-0">
          {currentUser?.full_name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost() }}
            placeholder="Agrega una actualización, nota o observación... (Cmd+Enter para publicar)"
            rows={3}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-slate-50"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handlePost}
              disabled={posting || !content.trim()}
              className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {posting ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      {observations.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <div className="text-3xl mb-2">💬</div>
          <p className="text-sm">Sin actualizaciones aún. ¡Sé el primero en escribir!</p>
        </div>
      )}

      <div className="space-y-4">
        {observations.map(obs => {
          const isAuthor = obs.created_by === currentUser?.id
          const isEditing = editingId === obs.id

          return (
            <div key={obs.id} className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600 flex-shrink-0">
                {obs.author?.full_name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-800">
                    {obs.author?.full_name ?? 'Usuario'}
                  </span>
                  <span className="text-xs text-slate-400">{timeAgo(obs.created_at)}</span>
                  {obs.is_edited && <span className="text-xs text-slate-400">(editado)</span>}
                </div>

                {isEditing ? (
                  <div>
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                    <div className="flex gap-2 mt-1.5">
                      <button onClick={() => handleEdit(obs.id)}
                        className="text-xs px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Guardar
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="text-xs px-3 py-1 text-slate-500 hover:text-slate-700">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{obs.content}</p>
                  </div>
                )}

                {isAuthor && !isEditing && (
                  <div className="flex gap-3 mt-1.5">
                    <button onClick={() => startEdit(obs)}
                      className="text-xs text-slate-400 hover:text-indigo-600 transition-colors">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(obs.id)}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
