'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteProjectButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${projectName}"? Se borrarán todas las tareas, contactos y observaciones.`)) return
    await supabase.from('projects').delete().eq('id', projectId)
    router.push('/projects')
    router.refresh()
  }

  return (
    <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 transition-colors">
      Eliminar
    </button>
  )
}
