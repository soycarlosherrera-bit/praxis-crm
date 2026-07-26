'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/dashboard',          label: 'Dashboard',    icon: '🏠' },
  { href: '/dashboard/members',  label: 'Familia y salud', icon: '❤️' },
  { href: '/dashboard/recipes',  label: 'Recetario',    icon: '📖' },
  { href: '/dashboard/planner',  label: 'Planificador', icon: '🗓️' },
  { href: '/dashboard/shopping', label: 'Compras',      icon: '🛒' },
  { href: '/dashboard/budget',   label: 'Presupuesto',  icon: '💰' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-sm">
            🍽️
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">Comidas Familiares</div>
            <div className="text-xs text-slate-400">v0.1</div>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span>🚪</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
