'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos' : error.message)
        setLoading(false)
        return
      }
      router.push('/dashboard')
      router.refresh()
      return
    }

    // signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      // Confirmación de correo deshabilitada en el proyecto: ya hay sesión.
      router.push('/dashboard')
      router.refresh()
      return
    }

    setMessage('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión aquí.')
    setMode('login')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🍽️</div>
          <h1 className="text-2xl font-bold text-slate-900">Comidas Familiares</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Presupuesto · Recetas · Salud familiar
          </p>
        </div>

        <div className="flex mb-6 bg-slate-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); setMessage(null) }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); setMessage(null) }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Crear cuenta
          </button>
        </div>

        {message && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-4">
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Un momento...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}
