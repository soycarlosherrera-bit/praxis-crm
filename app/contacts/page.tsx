import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*, project_contacts(project_id, status, projects(name, color, icon))')
    .eq('owner_id', user.id)
    .order('full_name')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contactos</h1>
          <p className="text-slate-500 text-sm mt-0.5">{contacts?.length ?? 0} contactos en tu directorio</p>
        </div>
      </div>

      {(!contacts || contacts.length === 0) && (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-4">👥</div>
          <h2 className="text-lg font-medium text-slate-600">Sin contactos aún</h2>
          <p className="text-sm mt-1">Los contactos se crean desde cada proyecto</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresa</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacto</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Proyectos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contacts?.map(contact => (
              <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
                      {contact.full_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{contact.full_name}</p>
                      {contact.position && <p className="text-xs text-slate-400">{contact.position}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-600">{contact.company ?? '—'}</td>
                <td className="px-5 py-3">
                  <div className="space-y-0.5">
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="block text-indigo-600 hover:underline text-xs">
                        {contact.email}
                      </a>
                    )}
                    {contact.phone && <p className="text-xs text-slate-500">{contact.phone}</p>}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(contact.project_contacts as any[])?.map((pc: any) => (
                      <span
                        key={pc.project_id}
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${pc.projects?.color ?? '#6366f1'}18`,
                          color: pc.projects?.color ?? '#6366f1'
                        }}
                      >
                        {pc.projects?.icon} {pc.projects?.name}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
