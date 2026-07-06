'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CONTACT_STATUS_LABELS } from '@/lib/types'
import type { ContactStatus, ProjectContactWithContact } from '@/lib/types'

interface Props {
  projectId: string
  projectContacts: ProjectContactWithContact[]
  userId: string
}

const STATUS_COLORS: Record<ContactStatus, string> = {
  lead:     'bg-purple-100 text-purple-700',
  active:   'bg-emerald-100 text-emerald-700',
  pending:  'bg-amber-100 text-amber-700',
  inactive: 'bg-slate-100 text-slate-500',
}

export default function ContactSection({ projectId, projectContacts: initial, userId }: Props) {
  const supabase = createClient()
  const [contacts, setContacts] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    status: 'active' as ContactStatus,
    follow_up_date: '',
    notes: '',
  })
  const [posting, setPosting] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setPosting(true)

    // 1. Crear el contacto global
    const { data: contactData, error: cErr } = await supabase
      .from('contacts')
      .insert({
        owner_id: userId,
        full_name: form.full_name,
        email: form.email || null,
        phone: form.phone || null,
        company: form.company || null,
        position: form.position || null,
      })
      .select()
      .single()

    if (!cErr && contactData) {
      // 2. Vincularlo al proyecto
      const { data: pcData, error: pcErr } = await supabase
        .from('project_contacts')
        .insert({
          project_id: projectId,
          contact_id: contactData.id,
          status: form.status,
          follow_up_date: form.follow_up_date || null,
          notes: form.notes || null,
          added_by: userId,
        })
        .select('*, contact:contacts(*)')
        .single()

      if (!pcErr && pcData) {
        setContacts(prev => [...prev, pcData as ProjectContactWithContact])
        setForm({ full_name: '', email: '', phone: '', company: '', position: '', status: 'active', follow_up_date: '', notes: '' })
        setShowForm(false)
      }
    }
    setPosting(false)
  }

  async function handleStatusChange(id: string, status: ContactStatus) {
    await supabase.from('project_contacts').update({ status }).eq('id', id)
    setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  async function handleRemove(id: string) {
    await supabase.from('project_contacts').delete().eq('id', id)
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800">👤 Contactos del proyecto</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Agregar contacto
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Nombre completo *"
              required
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="Email"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="Teléfono"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={form.company}
              onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
              placeholder="Empresa"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as ContactStatus }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="lead">Lead</option>
              <option value="active">Activo</option>
              <option value="pending">Pendiente</option>
              <option value="inactive">Inactivo</option>
            </select>
            <input
              type="date"
              value={form.follow_up_date}
              onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notas sobre este contacto en el proyecto..."
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="text-sm text-slate-500 px-3 py-1.5 hover:text-slate-700">
              Cancelar
            </button>
            <button type="submit" disabled={posting}
              className="text-sm px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {posting ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </form>
      )}

      {contacts.length === 0 && !showForm && (
        <div className="text-center py-8 text-slate-400">
          <div className="text-3xl mb-2">👤</div>
          <p className="text-sm">Sin contactos en este proyecto</p>
        </div>
      )}

      <div className="space-y-2">
        {contacts.map(pc => {
          const contact = pc.contact
          const needsFollowUp = pc.follow_up_date && new Date(pc.follow_up_date) <= new Date()
          return (
            <div key={pc.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600 flex-shrink-0">
                {contact?.full_name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800">{contact?.full_name}</p>
                  {needsFollowUp && (
                    <span className="text-xs text-amber-600 font-medium">📅 Follow-up hoy</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {[contact?.company, contact?.position, contact?.email].filter(Boolean).join(' · ')}
                </p>
                {pc.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{pc.notes}</p>}
              </div>
              <select
                value={pc.status}
                onChange={e => handleStatusChange(pc.id, e.target.value as ContactStatus)}
                className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${STATUS_COLORS[pc.status as ContactStatus]}`}
              >
                <option value="lead">Lead</option>
                <option value="active">Activo</option>
                <option value="pending">Pendiente</option>
                <option value="inactive">Inactivo</option>
              </select>
              <button
                onClick={() => handleRemove(pc.id)}
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
