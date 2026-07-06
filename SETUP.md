# PRAXIS CRM — Guía de Setup y Deploy

## Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL + Auth + RLS)
- **Deploy:** Vercel

---

## Paso 1 — Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) → **New project**
2. Ponle nombre: `praxis-crm`
3. Elige región: `South America (São Paulo)` para menor latencia
4. Guarda la contraseña de la BD en un lugar seguro

---

## Paso 2 — Ejecutar el schema

1. En tu proyecto Supabase, ve a **SQL Editor**
2. Crea un **New query**
3. Pega todo el contenido de `schema.sql`
4. Ejecuta → debe mostrar `Success` sin errores

---

## Paso 3 — Configurar Auth (Magic Link)

1. En Supabase: **Authentication → Email Templates**
2. El magic link ya viene configurado por defecto
3. En **Authentication → URL Configuration**:
   - Site URL: `https://tu-proyecto.vercel.app`
   - Redirect URLs: agrega `https://tu-proyecto.vercel.app/auth/callback`

Para desarrollo local agrega también:
- `http://localhost:3000/auth/callback`

---

## Paso 4 — Crear repo y proyecto Next.js

```bash
# Opción A: Clonar la carpeta generada
# Copia todos los archivos generados a tu carpeta de proyecto

# Opción B: Crear desde cero y copiar archivos
npx create-next-app@latest praxis-crm --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd praxis-crm
# Reemplaza los archivos con los generados por Claude

# Instalar dependencias de Supabase
npm install @supabase/ssr @supabase/supabase-js
```

---

## Paso 5 — Variables de entorno

Crea `.env.local` en la raíz del proyecto:

```bash
cp .env.example .env.local
```

Luego edita `.env.local` con tus valores de Supabase:
- Ve a **Settings → API** en tu proyecto Supabase
- Copia `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- Copia `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Paso 6 — Correr localmente

```bash
npm run dev
# → http://localhost:3000
```

Visita `http://localhost:3000` → redirige a `/login` → ingresa tu email → click en el magic link → ¡listo!

---

## Paso 7 — Deploy en Vercel

```bash
# Instala Vercel CLI (opcional)
npm i -g vercel

# Deploy
vercel

# O conecta el repo desde vercel.com:
# New Project → Import Git Repository → elige tu repo
```

### Variables de entorno en Vercel
En tu proyecto Vercel → **Settings → Environment Variables**:
```
NEXT_PUBLIC_SUPABASE_URL     = tu-url
NEXT_PUBLIC_SUPABASE_ANON_KEY = tu-anon-key
```

---

## Estructura del proyecto

```
praxis-crm/
├── schema.sql                    ← Ejecutar en Supabase SQL Editor
├── .env.local                    ← Variables de entorno (no commitear)
├── middleware.ts                 ← Protección de rutas
├── lib/
│   ├── types.ts                  ← Tipos TypeScript de toda la app
│   └── supabase/
│       ├── client.ts             ← Cliente browser (componentes client)
│       └── server.ts             ← Cliente server (Server Components)
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  ← Redirige a /dashboard
│   ├── login/page.tsx            ← Login con Magic Link
│   ├── auth/callback/route.ts    ← Callback de auth
│   ├── dashboard/
│   │   ├── layout.tsx            ← Layout con Sidebar
│   │   └── page.tsx              ← Dashboard principal + índice PRAXIS
│   ├── projects/
│   │   ├── page.tsx              ← Lista de proyectos
│   │   ├── new/page.tsx          ← Crear proyecto
│   │   └── [id]/
│   │       ├── page.tsx          ← Detalle del proyecto
│   │       └── edit/page.tsx     ← Editar / eliminar proyecto
│   └── contacts/page.tsx         ← Directorio global de contactos
└── components/
    ├── Sidebar.tsx               ← Navegación lateral
    ├── PraxisSliders.tsx         ← Sliders interactivos PRAXIS (0-100%)
    ├── ObservationFeed.tsx       ← Feed tipo Asana (crear/editar/borrar)
    ├── TaskSection.tsx           ← Tareas con filtros y estados
    ├── ContactSection.tsx        ← Contactos por proyecto con estados
    ├── InviteMember.tsx          ← Invitar colaboradores
    └── DeleteProjectButton.tsx   ← Botón de eliminar con confirmación
```

---

## Proyectos iniciales sugeridos

Una vez dentro del CRM, crea estos proyectos:

| Proyecto | Ícono | Color |
|----------|-------|-------|
| Capital Link — Don Chicharrón | 🍕 | #f97316 |
| Mr. Website | 🚀 | #6366f1 |
| Filosofía Terapéutica | ✨ | #8b5cf6 |

---

## Funcionalidades implementadas

- ✅ Login con Magic Link (email sin contraseña)
- ✅ Multi-usuario con acceso por proyecto (editor / visor)
- ✅ CRUD completo de proyectos (crear, editar, eliminar)
- ✅ Indicador PRAXIS con sliders 0-100% por dimensión
- ✅ Feed de observaciones tipo Asana (crear, editar, borrar)
- ✅ Tareas con prioridad, fecha/hora y estados (pendiente → en progreso → hecho)
- ✅ Contactos por proyecto con estado de seguimiento
- ✅ Directorio global de contactos
- ✅ Dashboard con índice PRAXIS global y tareas próximas
- ✅ RLS: cada usuario solo ve sus datos y los proyectos donde fue invitado
- ✅ Auto-setup de 5 scores PRAXIS al crear proyecto (trigger)

---

## Siguiente iteración sugerida

- [ ] Notificaciones de follow-up por email (Supabase Edge Functions + Resend)
- [ ] Invitación por email con Supabase Edge Functions
- [ ] Filtros y búsqueda en proyectos y contactos
- [ ] Vista Kanban de tareas con drag & drop
- [ ] Exportar reporte de proyecto a PDF
