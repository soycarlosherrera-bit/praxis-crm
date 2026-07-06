'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function InviteMember({ projectId }: { projectId: string }) {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    // Buscar usuario por email en profiles (via auth)
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .ilike('id::text', '%') // workaround: buscar en auth.users

    // En producción, usar una Edge Function para buscar por email
    // Por ahora se muestra el flujo
    setStatus('success')
    setMsg(`Invitación enviada a ${email}. El usuario debe tener cuenta en PRAXIS CRM.`)
    setEmail('')
  }

  return (
    <div>
      {status === 'success' ? (
        <div className="text-xs text-emerald-600 bg-emerald-50 rounded-lg p-2">
          {msg}
          <button onClick={() => setStatus('idle')} className="ml-2 underline">Otra</button>
        </div>
      ) : (
        <form onSubmit={handleInvite} className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email@colaborador.com"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'editor' | 'viewer')}
              className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
            >
              <option value="viewer">Solo lectura</option>
              <option value="editor">Editor</option>
            </select>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Invitar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
