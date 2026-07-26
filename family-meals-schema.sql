-- ============================================================
-- FAMILY MEALS — Schema para planificación de comidas familiares
-- Presupuesto · Insumos · Recetas · Perfiles de salud · Compras
-- ============================================================
-- Proyecto Supabase independiente del CRM (praxis-crm).
-- Ejecutar completo en el SQL Editor de un proyecto Supabase nuevo.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- TIPOS
-- ============================================================
create type household_role as enum (
  'owner', 'editor', 'viewer'
);

create type health_condition as enum (
  'ninguna', 'erc', 'adulto_mayor', 'otra'
);

create type diet_texture as enum (
  'normal', 'blanda', 'triturada'
);

create type ingredient_category as enum (
  'proteina', 'verdura', 'fruta', 'cereal', 'lacteo', 'grasa', 'condimento', 'otro'
);

create type meal_type as enum (
  'desayuno', 'almuerzo', 'cena', 'refaccion'
);

create type suitability_status as enum (
  'apto', 'precaucion', 'evitar'
);

create type product_photo_type as enum (
  'empaque', 'etiqueta_nutricional', 'recibo'
);

create type shopping_list_status as enum (
  'borrador', 'comprado'
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
-- HOUSEHOLDS (una familia = un espacio de datos compartido)
-- ============================================================
create table public.households (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  owner_id    uuid references public.profiles(id) on delete cascade not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- HOUSEHOLD ACCESS (miembros de la app con acceso al household)
-- ============================================================
create table public.household_access (
  id           uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households(id) on delete cascade not null,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  role         household_role default 'viewer',
  invited_by   uuid references public.profiles(id),
  invited_at   timestamptz default now(),
  accepted_at  timestamptz,
  unique(household_id, user_id)
);

-- ============================================================
-- HOUSEHOLD MEMBERS (personas de la familia — no usuarios de la app)
-- ============================================================
create table public.household_members (
  id           uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households(id) on delete cascade not null,
  full_name    text not null,
  birth_date   date,
  relationship text,
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ============================================================
-- HEALTH PROFILES (1:1 con household_members, opcional)
-- ============================================================
create table public.health_profiles (
  id                     uuid default uuid_generate_v4() primary key,
  member_id              uuid references public.household_members(id) on delete cascade not null unique,
  condition              health_condition default 'ninguna',
  ckd_stage              text,
  sodium_mg_max          integer,
  potassium_mg_max       integer,
  phosphorus_mg_max      integer,
  protein_g_min          numeric,
  protein_g_max          numeric,
  fluid_ml_max           integer,
  texture                diet_texture default 'normal',
  doctor_name            text,
  last_reviewed_at       date,
  notes                  text,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- ============================================================
-- INGREDIENTS (genéricos)
-- ============================================================
create table public.ingredients (
  id           uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households(id) on delete cascade not null,
  name         text not null,
  category     ingredient_category default 'otro',
  unit_base    text not null default 'g',   -- g, ml, unidad, etc.
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(household_id, name)
);

-- ============================================================
-- INGREDIENT NUTRITION (por 100 unidad_base: 100g o 100ml)
-- ============================================================
create table public.ingredient_nutrition (
  ingredient_id  uuid references public.ingredients(id) on delete cascade primary key,
  calories       numeric,
  protein_g      numeric,
  sodium_mg      numeric,
  potassium_mg   numeric,
  phosphorus_mg  numeric,
  carbs_g        numeric,
  fat_g          numeric,
  fluid_ml       numeric,
  updated_at     timestamptz default now()
);

-- ============================================================
-- PRODUCTS (marca específica de un ingrediente — catálogo por foto)
-- ============================================================
create table public.products (
  id                uuid default uuid_generate_v4() primary key,
  household_id      uuid references public.households(id) on delete cascade not null,
  ingredient_id     uuid references public.ingredients(id) on delete cascade not null,
  brand             text not null,
  package_size      numeric,
  package_unit      text,
  store             text,
  price             numeric,
  currency          text default 'GTQ',
  barcode           text,
  -- si la nutrición de esta marca difiere del ingrediente genérico
  sodium_mg_override      numeric,
  potassium_mg_override   numeric,
  phosphorus_mg_override  numeric,
  protein_g_override      numeric,
  notes             text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ============================================================
-- PRODUCT PHOTOS (fotos de empaque / etiqueta nutricional / recibo)
-- ============================================================
create table public.product_photos (
  id           uuid default uuid_generate_v4() primary key,
  product_id   uuid references public.products(id) on delete cascade not null,
  photo_url    text not null,
  type         product_photo_type default 'empaque',
  uploaded_at  timestamptz default now()
);

-- ============================================================
-- PRODUCT PRICE HISTORY (memoria de precios en el tiempo)
-- ============================================================
create table public.product_price_history (
  id           uuid default uuid_generate_v4() primary key,
  product_id   uuid references public.products(id) on delete cascade not null,
  price        numeric not null,
  store        text,
  observed_at  timestamptz default now()
);

-- ============================================================
-- RECIPES
-- ============================================================
create table public.recipes (
  id            uuid default uuid_generate_v4() primary key,
  household_id  uuid references public.households(id) on delete cascade not null,
  name          text not null,
  meal_type     meal_type not null,
  servings      integer not null default 1,
  prep_time_min integer,
  instructions  text,
  notes         text,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- RECIPE INGREDIENTS
-- ============================================================
create table public.recipe_ingredients (
  id                  uuid default uuid_generate_v4() primary key,
  recipe_id           uuid references public.recipes(id) on delete cascade not null,
  ingredient_id       uuid references public.ingredients(id) on delete cascade not null,
  preferred_product_id uuid references public.products(id) on delete set null,
  quantity            numeric not null,
  unit                text not null,
  created_at          timestamptz default now()
);

-- ============================================================
-- RECIPE NUTRITION CACHE (calculado por la app, no por trigger SQL —
-- las conversiones de unidad y overrides de producto se resuelven
-- en la capa de aplicación / Edge Function y se guardan aquí)
-- ============================================================
create table public.recipe_nutrition_cache (
  recipe_id      uuid references public.recipes(id) on delete cascade primary key,
  calories       numeric,
  protein_g      numeric,
  sodium_mg      numeric,
  potassium_mg   numeric,
  phosphorus_mg  numeric,
  cost_estimate  numeric,
  calculated_at  timestamptz default now()
);

-- ============================================================
-- RECIPE SUITABILITY (calculado por la app comparando
-- recipe_nutrition_cache contra health_profiles de cada miembro)
-- ============================================================
create table public.recipe_suitability (
  id             uuid default uuid_generate_v4() primary key,
  recipe_id      uuid references public.recipes(id) on delete cascade not null,
  member_id      uuid references public.household_members(id) on delete cascade not null,
  status         suitability_status not null default 'apto',
  reason         text,
  calculated_at  timestamptz default now(),
  unique(recipe_id, member_id)
);

-- ============================================================
-- MEAL PLANS (planificador semanal)
-- ============================================================
create table public.meal_plans (
  id            uuid default uuid_generate_v4() primary key,
  household_id  uuid references public.households(id) on delete cascade not null,
  week_start_date date not null,
  budget_target numeric,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(household_id, week_start_date)
);

-- ============================================================
-- MEAL PLAN ENTRIES
-- ============================================================
create table public.meal_plan_entries (
  id                uuid default uuid_generate_v4() primary key,
  plan_id           uuid references public.meal_plans(id) on delete cascade not null,
  date              date not null,
  meal_type         meal_type not null,
  recipe_id         uuid references public.recipes(id) on delete cascade not null,
  servings_planned  integer not null default 1,
  cooked            boolean default false,
  created_at        timestamptz default now()
);

-- ============================================================
-- SHOPPING LISTS
-- ============================================================
create table public.shopping_lists (
  id            uuid default uuid_generate_v4() primary key,
  household_id  uuid references public.households(id) on delete cascade not null,
  plan_id       uuid references public.meal_plans(id) on delete set null,
  status        shopping_list_status default 'borrador',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- SHOPPING LIST ITEMS
-- ============================================================
create table public.shopping_list_items (
  id               uuid default uuid_generate_v4() primary key,
  list_id          uuid references public.shopping_lists(id) on delete cascade not null,
  ingredient_id    uuid references public.ingredients(id) on delete cascade not null,
  product_id       uuid references public.products(id) on delete set null,
  quantity_total   numeric not null,
  unit             text not null,
  estimated_cost   numeric,
  actual_cost      numeric,
  purchased        boolean default false,
  created_at       timestamptz default now()
);

-- ============================================================
-- EXPENSES (historial real de gasto, opcional)
-- ============================================================
create table public.expenses (
  id                uuid default uuid_generate_v4() primary key,
  household_id      uuid references public.households(id) on delete cascade not null,
  shopping_list_id  uuid references public.shopping_lists(id) on delete set null,
  amount            numeric not null,
  description        text,
  spent_at          date default current_date,
  created_at        timestamptz default now()
);

-- ============================================================
-- FUNCIONES HELPER
-- ============================================================

-- Verifica si el usuario actual tiene acceso al household
create or replace function public.has_household_access(p_household_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.households h
    where h.id = p_household_id
      and (
        h.owner_id = auth.uid()
        or exists (
          select 1 from public.household_access ha
          where ha.household_id = p_household_id
            and ha.user_id = auth.uid()
            and ha.accepted_at is not null
        )
      )
  );
$$;

-- Verifica si el usuario es owner del household
create or replace function public.is_household_owner(p_household_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.households h
    where h.id = p_household_id and h.owner_id = auth.uid()
  );
$$;

-- Verifica si el usuario es owner o editor del household
create or replace function public.can_edit_household(p_household_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.households h
    where h.id = p_household_id and (
      h.owner_id = auth.uid()
      or exists (
        select 1 from public.household_access ha
        where ha.household_id = p_household_id
          and ha.user_id = auth.uid()
          and ha.role in ('owner', 'editor')
          and ha.accepted_at is not null
      )
    )
  );
$$;

-- Household de un ingrediente/receta/producto (para políticas RLS anidadas)
create or replace function public.household_of_ingredient(p_ingredient_id uuid)
returns uuid
language sql
stable
as $$
  select household_id from public.ingredients where id = p_ingredient_id;
$$;

create or replace function public.household_of_recipe(p_recipe_id uuid)
returns uuid
language sql
stable
as $$
  select household_id from public.recipes where id = p_recipe_id;
$$;

create or replace function public.household_of_product(p_product_id uuid)
returns uuid
language sql
stable
as $$
  select household_id from public.products where id = p_product_id;
$$;

create or replace function public.household_of_member(p_member_id uuid)
returns uuid
language sql
stable
as $$
  select household_id from public.household_members where id = p_member_id;
$$;

create or replace function public.household_of_plan(p_plan_id uuid)
returns uuid
language sql
stable
as $$
  select household_id from public.meal_plans where id = p_plan_id;
$$;

create or replace function public.household_of_list(p_list_id uuid)
returns uuid
language sql
stable
as $$
  select household_id from public.shopping_lists where id = p_list_id;
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

create trigger trg_households_updated_at
  before update on public.households
  for each row execute procedure public.handle_updated_at();

create trigger trg_household_members_updated_at
  before update on public.household_members
  for each row execute procedure public.handle_updated_at();

create trigger trg_health_profiles_updated_at
  before update on public.health_profiles
  for each row execute procedure public.handle_updated_at();

create trigger trg_ingredients_updated_at
  before update on public.ingredients
  for each row execute procedure public.handle_updated_at();

create trigger trg_products_updated_at
  before update on public.products
  for each row execute procedure public.handle_updated_at();

create trigger trg_recipes_updated_at
  before update on public.recipes
  for each row execute procedure public.handle_updated_at();

create trigger trg_meal_plans_updated_at
  before update on public.meal_plans
  for each row execute procedure public.handle_updated_at();

create trigger trg_shopping_lists_updated_at
  before update on public.shopping_lists
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
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles               enable row level security;
alter table public.households              enable row level security;
alter table public.household_access        enable row level security;
alter table public.household_members       enable row level security;
alter table public.health_profiles         enable row level security;
alter table public.ingredients             enable row level security;
alter table public.ingredient_nutrition    enable row level security;
alter table public.products                enable row level security;
alter table public.product_photos          enable row level security;
alter table public.product_price_history   enable row level security;
alter table public.recipes                 enable row level security;
alter table public.recipe_ingredients      enable row level security;
alter table public.recipe_nutrition_cache  enable row level security;
alter table public.recipe_suitability      enable row level security;
alter table public.meal_plans              enable row level security;
alter table public.meal_plan_entries       enable row level security;
alter table public.shopping_lists          enable row level security;
alter table public.shopping_list_items     enable row level security;
alter table public.expenses                enable row level security;

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

-- HOUSEHOLDS
create policy "Ver households con acceso"
  on public.households for select
  using (has_household_access(id));

create policy "Crear households"
  on public.households for insert
  with check (owner_id = auth.uid());

create policy "Editar household (owner o editor)"
  on public.households for update
  using (can_edit_household(id));

create policy "Borrar household (solo owner)"
  on public.households for delete
  using (is_household_owner(id));

-- HOUSEHOLD ACCESS
create policy "Ver accesos del household"
  on public.household_access for select
  using (has_household_access(household_id));

create policy "Owner gestiona accesos"
  on public.household_access for all
  using (is_household_owner(household_id));

-- HOUSEHOLD MEMBERS
create policy "Ver miembros con acceso"
  on public.household_members for select
  using (has_household_access(household_id));

create policy "Gestionar miembros (editor+)"
  on public.household_members for all
  using (can_edit_household(household_id));

-- HEALTH PROFILES
create policy "Ver perfiles de salud con acceso"
  on public.health_profiles for select
  using (has_household_access(household_of_member(member_id)));

create policy "Gestionar perfiles de salud (editor+)"
  on public.health_profiles for all
  using (can_edit_household(household_of_member(member_id)));

-- INGREDIENTS
create policy "Ver ingredientes con acceso"
  on public.ingredients for select
  using (has_household_access(household_id));

create policy "Gestionar ingredientes (editor+)"
  on public.ingredients for all
  using (can_edit_household(household_id));

-- INGREDIENT NUTRITION
create policy "Ver nutrición con acceso"
  on public.ingredient_nutrition for select
  using (has_household_access(household_of_ingredient(ingredient_id)));

create policy "Gestionar nutrición (editor+)"
  on public.ingredient_nutrition for all
  using (can_edit_household(household_of_ingredient(ingredient_id)));

-- PRODUCTS
create policy "Ver productos con acceso"
  on public.products for select
  using (has_household_access(household_id));

create policy "Gestionar productos (editor+)"
  on public.products for all
  using (can_edit_household(household_id));

-- PRODUCT PHOTOS
create policy "Ver fotos con acceso"
  on public.product_photos for select
  using (has_household_access(household_of_product(product_id)));

create policy "Gestionar fotos (editor+)"
  on public.product_photos for all
  using (can_edit_household(household_of_product(product_id)));

-- PRODUCT PRICE HISTORY
create policy "Ver historial de precios con acceso"
  on public.product_price_history for select
  using (has_household_access(household_of_product(product_id)));

create policy "Insertar historial de precios (editor+)"
  on public.product_price_history for insert
  with check (can_edit_household(household_of_product(product_id)));

-- RECIPES
create policy "Ver recetas con acceso"
  on public.recipes for select
  using (has_household_access(household_id));

create policy "Gestionar recetas (editor+)"
  on public.recipes for all
  using (can_edit_household(household_id));

-- RECIPE INGREDIENTS
create policy "Ver ingredientes de receta con acceso"
  on public.recipe_ingredients for select
  using (has_household_access(household_of_recipe(recipe_id)));

create policy "Gestionar ingredientes de receta (editor+)"
  on public.recipe_ingredients for all
  using (can_edit_household(household_of_recipe(recipe_id)));

-- RECIPE NUTRITION CACHE
create policy "Ver nutrición de receta con acceso"
  on public.recipe_nutrition_cache for select
  using (has_household_access(household_of_recipe(recipe_id)));

create policy "Gestionar nutrición de receta (editor+)"
  on public.recipe_nutrition_cache for all
  using (can_edit_household(household_of_recipe(recipe_id)));

-- RECIPE SUITABILITY
create policy "Ver suitability con acceso"
  on public.recipe_suitability for select
  using (has_household_access(household_of_recipe(recipe_id)));

create policy "Gestionar suitability (editor+)"
  on public.recipe_suitability for all
  using (can_edit_household(household_of_recipe(recipe_id)));

-- MEAL PLANS
create policy "Ver planes con acceso"
  on public.meal_plans for select
  using (has_household_access(household_id));

create policy "Gestionar planes (editor+)"
  on public.meal_plans for all
  using (can_edit_household(household_id));

-- MEAL PLAN ENTRIES
create policy "Ver entradas de plan con acceso"
  on public.meal_plan_entries for select
  using (has_household_access(household_of_plan(plan_id)));

create policy "Gestionar entradas de plan (editor+)"
  on public.meal_plan_entries for all
  using (can_edit_household(household_of_plan(plan_id)));

-- SHOPPING LISTS
create policy "Ver listas con acceso"
  on public.shopping_lists for select
  using (has_household_access(household_id));

create policy "Gestionar listas (editor+)"
  on public.shopping_lists for all
  using (can_edit_household(household_id));

-- SHOPPING LIST ITEMS
create policy "Ver items de lista con acceso"
  on public.shopping_list_items for select
  using (has_household_access(household_of_list(list_id)));

create policy "Gestionar items de lista (editor+)"
  on public.shopping_list_items for all
  using (can_edit_household(household_of_list(list_id)));

-- EXPENSES
create policy "Ver gastos con acceso"
  on public.expenses for select
  using (has_household_access(household_id));

create policy "Gestionar gastos (editor+)"
  on public.expenses for all
  using (can_edit_household(household_id));

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
create index idx_households_owner          on public.households(owner_id);
create index idx_household_access_household on public.household_access(household_id);
create index idx_household_access_user      on public.household_access(user_id);
create index idx_household_members_household on public.household_members(household_id);
create index idx_ingredients_household      on public.ingredients(household_id);
create index idx_products_household         on public.products(household_id);
create index idx_products_ingredient        on public.products(ingredient_id);
create index idx_product_photos_product     on public.product_photos(product_id);
create index idx_price_history_product      on public.product_price_history(product_id);
create index idx_price_history_observed     on public.product_price_history(observed_at desc);
create index idx_recipes_household          on public.recipes(household_id);
create index idx_recipes_meal_type          on public.recipes(meal_type);
create index idx_recipe_ingredients_recipe  on public.recipe_ingredients(recipe_id);
create index idx_recipe_ingredients_ingredient on public.recipe_ingredients(ingredient_id);
create index idx_recipe_suitability_recipe  on public.recipe_suitability(recipe_id);
create index idx_recipe_suitability_member  on public.recipe_suitability(member_id);
create index idx_meal_plans_household       on public.meal_plans(household_id);
create index idx_meal_plans_week            on public.meal_plans(week_start_date);
create index idx_plan_entries_plan          on public.meal_plan_entries(plan_id);
create index idx_plan_entries_date          on public.meal_plan_entries(date);
create index idx_shopping_lists_household   on public.shopping_lists(household_id);
create index idx_shopping_lists_plan        on public.shopping_lists(plan_id);
create index idx_shopping_list_items_list   on public.shopping_list_items(list_id);
create index idx_expenses_household         on public.expenses(household_id);
create index idx_expenses_spent_at          on public.expenses(spent_at desc);
