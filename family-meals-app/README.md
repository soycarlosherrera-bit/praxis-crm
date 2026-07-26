# Comidas Familiares — App

Planificación de comidas familiares: presupuesto, insumos, recetas (desayuno, almuerzo,
cena y refacción) y perfiles de salud por integrante del hogar.

## Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL + Auth + RLS)

---

## Paso 1 — Crear proyecto en Supabase

Crea un proyecto nuevo en [supabase.com](https://supabase.com) (independiente del de PRAXIS CRM).

## Paso 2 — Ejecutar el schema

1. En Supabase: **SQL Editor → New query**
2. Pega todo el contenido de `../family-meals-schema.sql` (raíz del repo)
3. Ejecuta → debe mostrar `Success` sin errores

## Paso 3 — Configurar Auth (Magic Link)

En **Authentication → URL Configuration**, agrega como Redirect URL:
- `http://localhost:3000/auth/callback` (desarrollo local)
- `https://tu-proyecto.vercel.app/auth/callback` (producción)

## Paso 4 — Variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con los valores de **Settings → API** de tu proyecto Supabase:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Paso 5 — Instalar y correr localmente

```bash
npm install
npm run dev
# → http://localhost:3000
```

Visita `http://localhost:3000` → redirige a `/login` → ingresa tu email → click en el
magic link → crea tu hogar → ¡listo!

---

## Estructura del proyecto

```
family-meals-app/
├── middleware.ts               ← Protección de rutas
├── lib/
│   ├── types.ts                ← Tipos TypeScript (calcados de family-meals-schema.sql)
│   └── supabase/
│       ├── client.ts           ← Cliente browser
│       └── server.ts           ← Cliente server (Server Components)
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 ← Redirige a /dashboard
│   ├── login/page.tsx           ← Login con Magic Link
│   ├── auth/callback/route.ts   ← Callback de auth
│   ├── households/new/page.tsx  ← Crear hogar
│   └── dashboard/
│       ├── layout.tsx           ← Layout con Sidebar
│       ├── page.tsx             ← Overview del hogar
│       ├── members/page.tsx     ← Familia y salud (placeholder)
│       ├── recipes/page.tsx     ← Recetario (placeholder)
│       ├── planner/page.tsx     ← Planificador semanal (placeholder)
│       ├── shopping/page.tsx    ← Lista de compras (placeholder)
│       └── budget/page.tsx      ← Presupuesto (placeholder)
└── components/
    └── Sidebar.tsx
```

## Implementado en este scaffolding

- ✅ Login con Magic Link
- ✅ Middleware de protección de rutas
- ✅ Alta de hogar (`households`) con owner = usuario autenticado
- ✅ Dashboard con navegación a las 5 secciones principales
- ✅ Tipos TypeScript completos del modelo de datos

## Siguiente iteración sugerida

- [ ] CRUD de miembros del hogar y perfiles de salud
- [ ] CRUD de ingredientes y recetas, con cálculo de nutrición por porción
- [ ] Cálculo de `recipe_suitability` (apto/precaución/evitar) por miembro
- [ ] Planificador semanal con generación de lista de compras
- [ ] Catálogo de productos por marca con foto (Opción A: captura manual)
- [ ] Comparación de presupuesto objetivo vs. gasto real
