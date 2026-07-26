'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewHouseholdPage() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { error: insertError } = await supabase
      .from('households')
      .insert({ name, owner_id: user.id })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏡</div>
          <h1 className="text-2xl font-bold text-slate-900">Crea tu hogar</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Aquí vivirán los perfiles de salud, recetas, planificador y presupuesto de tu familia.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre del hogar
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. Familia Herrera"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creando...' : 'Crear hogar'}
          </button>
        </form>
      </div>
    </div>
  )
}
