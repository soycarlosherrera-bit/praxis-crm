'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (!error) setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🧭</div>
          <h1 className="text-2xl font-bold text-slate-900">PRAXIS CRM</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Trabajo · Recreación · Espíritu · Educación · Salud
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-3xl mb-3">📬</div>
            <h2 className="font-semibold text-slate-800">Revisa tu correo</h2>
            <p className="text-slate-500 text-sm mt-2">
              Te enviamos un magic link a <strong>{email}</strong>
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-4 text-indigo-600 text-sm hover:underline"
            >
              Usar otro correo
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Enviando...' : 'Entrar con Magic Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
