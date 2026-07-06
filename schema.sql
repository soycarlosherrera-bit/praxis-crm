-- ============================================================
-- PRAXIS CRM — Supabase Schema
-- Dimensiones: Trabajo · Recreación · Espíritu · Educación · Salud
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ============================================================
-- TIPOS
-- ============================================================
create type praxis_dimension as enum (
  'trabajo', 'recreacion', 'espiritu', 'educacion', 'salud'
);

create type project_status as enum (
  'active', 'paused', 'completed', 'archived'
);

create type task_status as enum (
  'pending', 'in_progress', 'done'
);

create type contact_status as enum (
  'lead', 'active', 'pending', 'inactive'
);

create type member_role as enum (
  'editor', 'viewer'
);

-- ============================================================
-- PROFILES (extiende auth.users)
-- ============================================================
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- ============================================================
-- PROJECTS
-- ============================================================
create table public.projects (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  description text,
  status      project_status default 'active',
  color       text default '#6366f1',   -- hex para UI
  icon        text default '📁',        -- emoji
  owner_id    uuid references public.profiles(id) on delete cascade not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- PRAXIS SCORES (5 dimensiones por proyecto, 0-100)
-- ============================================================
create table public.praxis_scores (
  id          uuid default uuid_generate_v4() primary key,
  project_id  uuid references public.projects(id) on delete cascade not null,
  dimension   praxis_dimension not null,
  score       integer default 0 check (score >= 0 and score <= 100),
  updated_at  timestamptz default now(),
  unique(project_id, dimension)
);

-- ============================================================
-- PROJECT MEMBERS (acceso compartido)
-- ============================================================
create table public.project_members (
  id           uuid default uuid_generate_v4() primary key,
  project_id   uuid references public.projects(id) on delete cascade not null,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  role         member_role default 'viewer',
  invited_by   uuid references public.profiles(id),
  invited_at   timestamptz default now(),
  accepted_at  timestamptz,
  unique(project_id, user_id)
);

-- ============================================================
-- CONTACTS (directorio global del propietario)
-- ============================================================
create table public.contacts (
  id          uuid default uuid_generate_v4() primary key,
  owner_id    uuid references public.profiles(id) on delete cascade not null,
  full_name   text not null,
  email       text,
  phone       text,
  company     text,
  position    text,
  notes       text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- PROJECT CONTACTS (relación proyecto ↔ contacto con tracking)
-- ============================================================
create table public.project_contacts (
  id              uuid default uuid_generate_v4() primary key,
  project_id      uuid references public.projects(id) on delete cascade not null,
  contact_id      uuid references public.contacts(id) on delete cascade not null,
  status          contact_status default 'active',
  follow_up_date  date,
  notes           text,
  added_by        uuid references public.profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(project_id, contact_id)
);

-- ============================================================
-- TASKS
-- ============================================================
create table public.tasks (
  id           uuid default uuid_generate_v4() primary key,
  project_id   uuid references public.projects(id) on delete cascade not null,
  title        text not null,
  description  text,
  status       task_status default 'pending',
  priority     text default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date     timestamptz,
  assigned_to  uuid references public.profiles(id),
  created_by   uuid references public.profiles(id) not null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ============================================================
-- OBSERVATIONS / FEED (tipo Asana — actualizaciones del proyecto)
-- ============================================================
create table public.observations (
  id           uuid default uuid_generate_v4() primary key,
  project_id   uuid references public.projects(id) on delete cascade not null,
  content      text not null,
  is_edited    boolean default false,
  created_by   uuid references public.profiles(id) not null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ============================================================
-- FUNCIONES HELPER
-- ============================================================

-- Verifica si el usuario actual tiene acceso al proyecto
create or replace function public.has_project_access(p_project_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p_project_id
            and pm.user_id = auth.uid()
            and pm.accepted_at is not null
        )
      )
  );
$$;

-- Verifica si el usuario es owner del proyecto
create or replace function public.is_project_owner(p_project_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.owner_id = auth.uid()
  );
$$;

-- Verifica si el usuario es owner o editor del proyecto
create or replace function public.can_edit_project(p_project_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id and (
      p.owner_id = auth.uid()
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = p_project_id
          and pm.user_id = auth.uid()
          and pm.role = 'editor'
          and pm.accepted_at is not null
      )
    )
  );
$$;

-- ============================================================
-- TRIGGERS — updated_at automático
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

create trigger trg_contacts_updated_at
  before update on public.contacts
  for each row execute procedure public.handle_updated_at();

create trigger trg_project_contacts_updated_at
  before update on public.project_contacts
  for each row execute procedure public.handle_updated_at();

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.handle_updated_at();

create trigger trg_observations_updated_at
  before update on public.observations
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- TRIGGER — auto-crear perfil al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER — auto-crear scores PRAXIS al crear proyecto
-- ============================================================
create or replace function public.handle_new_project()
returns trigger
language plpgsql
as $$
begin
  insert into public.praxis_scores (project_id, dimension, score)
  values
    (new.id, 'trabajo',    0),
    (new.id, 'recreacion', 0),
    (new.id, 'espiritu',   0),
    (new.id, 'educacion',  0),
    (new.id, 'salud',      0);
  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute procedure public.handle_new_project();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles         enable row level security;
alter table public.projects         enable row level security;
alter table public.praxis_scores    enable row level security;
alter table public.project_members  enable row level security;
alter table public.contacts         enable row level security;
alter table public.project_contacts enable row level security;
alter table public.tasks            enable row level security;
alter table public.observations     enable row level security;

-- PROFILES
create policy "Ver propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Actualizar propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Insertar propio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- También permitir ver perfil de colaboradores
create policy "Ver perfiles de colaboradores"
  on public.profiles for select
  using (
    exists (
      select 1 from public.project_members pm
      join public.projects p on p.id = pm.project_id
      where (pm.user_id = auth.uid() or p.owner_id = auth.uid())
        and (pm.user_id = profiles.id or p.owner_id = profiles.id)
    )
  );

-- PROJECTS
create policy "Ver proyectos con acceso"
  on public.projects for select
  using (has_project_access(id));

create policy "Crear proyectos"
  on public.projects for insert
  with check (owner_id = auth.uid());

create policy "Editar proyecto (owner o editor)"
  on public.projects for update
  using (can_edit_project(id));

create policy "Borrar proyecto (solo owner)"
  on public.projects for delete
  using (is_project_owner(id));

-- PRAXIS SCORES
create policy "Ver scores con acceso"
  on public.praxis_scores for select
  using (has_project_access(project_id));

create policy "Editar scores (owner o editor)"
  on public.praxis_scores for update
  using (can_edit_project(project_id));

create policy "Insertar scores"
  on public.praxis_scores for insert
  with check (can_edit_project(project_id));

-- PROJECT MEMBERS
create policy "Ver miembros del proyecto"
  on public.project_members for select
  using (has_project_access(project_id));

create policy "Owner gestiona miembros"
  on public.project_members for all
  using (is_project_owner(project_id));

-- CONTACTS
create policy "Ver propios contactos"
  on public.contacts for select
  using (owner_id = auth.uid());

create policy "Gestionar propios contactos"
  on public.contacts for all
  using (owner_id = auth.uid());

-- PROJECT CONTACTS
create policy "Ver contactos del proyecto"
  on public.project_contacts for select
  using (has_project_access(project_id));

create policy "Gestionar contactos del proyecto (editor+)"
  on public.project_contacts for all
  using (can_edit_project(project_id));

-- TASKS
create policy "Ver tareas del proyecto"
  on public.tasks for select
  using (has_project_access(project_id));

create policy "Crear tareas (editor+)"
  on public.tasks for insert
  with check (can_edit_project(project_id) and created_by = auth.uid());

create policy "Editar tareas (editor+)"
  on public.tasks for update
  using (can_edit_project(project_id));

create policy "Borrar tareas (editor+)"
  on public.tasks for delete
  using (can_edit_project(project_id));

-- OBSERVATIONS
create policy "Ver observaciones del proyecto"
  on public.observations for select
  using (has_project_access(project_id));

create policy "Crear observaciones (acceso)"
  on public.observations for insert
  with check (has_project_access(project_id) and created_by = auth.uid());

create policy "Editar propia observación"
  on public.observations for update
  using (created_by = auth.uid());

create policy "Borrar propia observación"
  on public.observations for delete
  using (created_by = auth.uid() or is_project_owner(project_id));

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
create index idx_projects_owner       on public.projects(owner_id);
create index idx_projects_status      on public.projects(status);
create index idx_praxis_project       on public.praxis_scores(project_id);
create index idx_members_project      on public.project_members(project_id);
create index idx_members_user         on public.project_members(user_id);
create index idx_contacts_owner       on public.contacts(owner_id);
create index idx_pc_project           on public.project_contacts(project_id);
create index idx_pc_contact           on public.project_contacts(contact_id);
create index idx_tasks_project        on public.tasks(project_id);
create index idx_tasks_status         on public.tasks(status);
create index idx_tasks_due_date       on public.tasks(due_date);
create index idx_observations_project on public.observations(project_id);
create index idx_observations_created on public.observations(created_at desc);
