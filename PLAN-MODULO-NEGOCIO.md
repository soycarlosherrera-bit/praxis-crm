# Módulo de Negocio (Clientes → Cotizaciones → Eventos) — Plan de adaptación

> Adaptado de la guía "BrincoFiesta CRM — Planeación por Fases" (Laravel/Blade) al stack real de
> **praxis-crm**: Next.js 14 (App Router) + TypeScript + Tailwind + Supabase (Postgres + Auth + RLS) + Vercel.
> Objetivo: quedarnos con las ideas de negocio de esa guía (clientes, cotizaciones, eventos, calendario,
> personal, pagos) pero implementadas sobre la arquitectura multi-proyecto que praxis-crm ya tiene, para
> que este mismo módulo sirva de plantilla al agregar futuras aplicaciones de negocio (no solo eventos).

---

## 0. Qué se reutiliza de praxis-crm tal cual

praxis-crm ya resuelve varias cosas que la guía original de BrincoFiesta planeaba construir desde cero
en Laravel. No hay que reconstruirlas:

| Necesidad en la guía original | Ya existe en praxis-crm como |
|---|---|
| Login, roles, sesiones (Fase 1) | Auth por Magic Link (Supabase Auth) + RLS |
| Multi-usuario con roles | `project_members` (`owner` implícito / `editor` / `viewer`) |
| Registro de clientes | `contacts` + `project_contacts` (con `status`, `follow_up_date`, `notes`) |
| Tareas con asignación y estado | `tasks` (`status`, `priority`, `due_date`, `assigned_to`) |
| Dashboard con resumen | `app/dashboard` ya tiene layout + índice PRAXIS |
| Un "negocio" o "cliente de Mr. Website" | Un `project` (cada fila de `projects` = un negocio/cuenta) |

Es decir: cada **negocio tipo BrincoFiesta se modela como un `project`** dentro de praxis-crm (igual que
"Capital Link — Don Chicharrón" o "Mr. Website"). Lo que falta es todo lo específico de la operación de
cotizar y ejecutar eventos, que se agrega como tablas nuevas **siempre con `project_id`**, para que el
mismo patrón sirva después para otro tipo de negocio (ej. un taller, una consultora, etc.) sin rediseñar.

Los sliders PRAXIS (trabajo/recreación/espíritu/educación/salud) son un tema aparte (balance de vida del
dueño) y no se tocan — este módulo vive junto a ellos dentro del mismo proyecto, no los reemplaza.

---

## 1. Prioridad confirmada: empezar por Clientes + Cotizaciones

Se construye primero la **Fase C** (equivalente a la Fase 3 de la guía original). Antes de tocar código
hay que decidir un punto de diseño:

- **Clientes**: ¿son la tabla `contacts` existente (con `project_contacts` para el estado por negocio) o
  una tabla `clientes` nueva y separada? Recomendación: reutilizar `contacts`/`project_contacts`, solo
  agregando el campo `canal_contacto` que la guía original pedía (redes_sociales, llamada, referido, otro)
  — evita duplicar directorio de personas y mantiene el "directorio global de contactos" que ya existe.

Una vez aprobado ese punto, la Fase C se construye así:

### 1.1 Cambios de esquema (Supabase / `schema.sql`)

```sql
-- Extiende contacts para cubrir el caso "cliente de evento"
alter table public.contacts
  add column canal_contacto text check (canal_contacto in ('redes_sociales','llamada','referido','otro'));

-- Catálogo de productos/servicios del negocio (Fase B, prerequisito de cotizaciones)
create type producto_tipo as enum ('producto', 'servicio');
create type producto_origen as enum ('propio', 'tercerizado');
create type producto_unidad as enum ('unidad', 'hora', 'dia', 'paquete');

create table public.productos_servicios (
  id            uuid default uuid_generate_v4() primary key,
  project_id    uuid references public.projects(id) on delete cascade not null,
  nombre        text not null,
  descripcion   text,
  tipo          producto_tipo not null default 'producto',
  origen        producto_origen not null default 'propio',
  unidad        producto_unidad not null default 'unidad',
  precio_base   numeric(12,2) not null default 0,
  activo        boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Cotizaciones
create type cotizacion_estado as enum ('borrador', 'enviada', 'aprobada', 'rechazada');

create table public.cotizaciones (
  id            uuid default uuid_generate_v4() primary key,
  project_id    uuid references public.projects(id) on delete cascade not null,
  contact_id    uuid references public.contacts(id) on delete restrict not null,
  codigo        text not null,          -- ej. COT-2026-0001, generado por trigger/secuencia
  estado        cotizacion_estado default 'borrador',
  fecha_emision date default current_date,
  notas         text,
  subtotal      numeric(12,2) default 0,
  total         numeric(12,2) default 0,
  created_by    uuid references public.profiles(id) not null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(project_id, codigo)
);

create table public.cotizacion_items (
  id                    uuid default uuid_generate_v4() primary key,
  cotizacion_id         uuid references public.cotizaciones(id) on delete cascade not null,
  producto_servicio_id  uuid references public.productos_servicios(id),
  descripcion_libre     text,           -- para items no catalogados
  cantidad              numeric(10,2) not null default 1,
  precio_unitario       numeric(12,2) not null default 0,
  subtotal              numeric(12,2) not null default 0,
  created_at            timestamptz default now()
);
```

RLS: mismas funciones helper que ya existen (`has_project_access`, `can_edit_project`), aplicadas a las
3 tablas nuevas igual que en `tasks`/`observations` — no hay que inventar un modelo de permisos nuevo.

`subtotal`/`total` de la cotización se recalculan con un trigger `AFTER INSERT/UPDATE/DELETE` sobre
`cotizacion_items`, igual patrón que el trigger `handle_new_project` ya usado para los scores PRAXIS.

### 1.2 Rutas y vistas (App Router)

```
app/projects/[id]/
├── catalogo/
│   ├── page.tsx              ← listado productos/servicios del negocio, filtros tipo/origen
│   └── [productoId]/edit     ← editar / activar-desactivar
├── cotizaciones/
│   ├── page.tsx               ← listado de cotizaciones del negocio (filtro por estado)
│   ├── new/page.tsx           ← selector de cliente + agregar items (catálogo o libres) + totales
│   └── [cotId]/
│       ├── page.tsx           ← detalle + cambio de estado (borrador→enviada→aprobada/rechazada)
│       └── print/page.tsx     ← vista imprimible, usa layouts/print (sin sidebar)
```

Componentes nuevos en `components/`: `CatalogoTable.tsx`, `CotizacionItemsEditor.tsx` (agregar/quitar
líneas con cálculo en vivo), `CotizacionStatusBadge.tsx`, `CotizacionPrintView.tsx`.

`layouts/print` no existe aún en Next.js/App Router — se resuelve con un route group
`app/(print)/layout.tsx` sin `<Sidebar />`, análogo a `layouts/print.blade.php` de la guía original.

### 1.3 Entregable de esta fase

- Cliente (contacto) con canal de contacto.
- Catálogo mínimo cargado para poder cotizar.
- Flujo cliente → cotización con items → totales automáticos → vista imprimible.
- Historial de cotizaciones visible en el detalle del contacto (reutilizando el patrón de
  `ObservationFeed`/`TaskSection` que ya existe por proyecto).

---

## 2. Fases siguientes (orden sugerido, no iniciar aún)

| Fase | Contenido | Se apoya en |
|---|---|---|
| D — Eventos y calendario | `eventos` (cotización aprobada → "Convertir a evento"), vista mensual | Fase C |
| E — Personal y tareas por evento | `personal`, `evento_personal`, extender `tasks` con `evento_id` nullable + `momento` (antes/durante/después) | Fase D |
| F — Pagos | `pagos` (adelanto/abono/total/extra), resumen financiero en detalle de evento | Fase D |
| G — Extras y cierre | `evento_extras`, recálculo de total, bloqueo de cierre si hay saldo pendiente, factura final imprimible | Fases E, F |
| H (futura) | Portal de personal: usar `project_members` con un rol de solo-lectura acotado a sus tareas, en vez de crear un sistema de roles paralelo (`staff`) como en la guía original | Todas |

Notas de adaptación para cuando se construyan:

- **Calendario (Fase D):** en Laravel la guía sugiere FullCalendar por CDN. En Next.js se recomienda
  `@fullcalendar/react` (o `react-big-calendar`) como dependencia npm normal — aquí sí aplica instalar
  paquetes, a diferencia del Blade/CDN de la guía original.
- **Tareas por evento (Fase E):** en vez de crear una tabla `tareas` paralela a la que ya existe, se
  reutiliza `public.tasks` agregando `evento_id uuid null references eventos(id)` y
  `momento producto_momento null` — un evento es, en el fondo, un tipo especial de "proyecto dentro del
  proyecto", y las tareas ya tienen todo lo demás (asignación, estado, prioridad).
- **Roles `admin/operativo/staff` de la guía original:** ya cubiertos por owner/editor/viewer de
  `project_members`; no se necesita un enum de rol de negocio aparte salvo que en el futuro se requiera
  una vista de "solo mis tareas" para personal de campo sin cuenta completa (eso es la Fase H).

---

## 3. Siguiente paso

Con este documento aprobado, el siguiente turno de trabajo implementa **solo la sección 1** (esquema +
rutas + vistas de Clientes/Catálogo/Cotizaciones) contra el `schema.sql` y la app real. Nada de esto se
ha aplicado todavía — es planeación, tal como se pidió.
