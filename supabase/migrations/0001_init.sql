-- =========================================================
-- Gastos App — esquema inicial
-- Correr esto en el SQL Editor de Supabase (o vía supabase CLI:
-- supabase db push).
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- households: un "hogar" es la unidad de datos compartidos.
-- Cada usuario nuevo recibe uno propio y puede invitar a otra
-- persona compartiendo el código.
-- ---------------------------------------------------------
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mi hogar',
  invite_code text not null unique default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index if not exists idx_household_members_user on public.household_members(user_id);

-- ---------------------------------------------------------
-- profiles: datos de la app para cada usuario (email y
-- contraseña ya los maneja Supabase Auth en auth.users).
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  currency text not null default 'ARS',
  theme text not null default 'auto',
  active_household_id uuid references public.households(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- categories
-- ---------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  color text not null default '#7A7A70',
  icon text not null default '✳️',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_categories_household on public.categories(household_id);

-- ---------------------------------------------------------
-- expenses
-- amount_cents: el monto se guarda en centavos (entero) para
-- evitar errores de redondeo con decimales.
-- ---------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  user_id uuid not null references auth.users(id),
  amount_cents bigint not null check (amount_cents > 0),
  description text default '',
  date date not null,
  payment_method text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_expenses_household on public.expenses(household_id);
create index if not exists idx_expenses_category on public.expenses(category_id);
create index if not exists idx_expenses_date on public.expenses(date);
create index if not exists idx_expenses_household_date on public.expenses(household_id, date desc);

-- ---------------------------------------------------------
-- Alta automática: al crear un usuario en Supabase Auth se le
-- crea su perfil, su hogar por defecto, la membresía y las
-- categorías iniciales.
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_household_id uuid;
begin
  insert into public.households (name) values ('Mi hogar') returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, new.id, 'owner');

  insert into public.profiles (id, name, active_household_id)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new_household_id);

  insert into public.categories (household_id, name, color, icon) values
    (new_household_id, 'Alimentación', '#3E7C59', '🍽️'),
    (new_household_id, 'Transporte', '#3B6E91', '🚌'),
    (new_household_id, 'Vivienda', '#8A5A3B', '🏠'),
    (new_household_id, 'Servicios', '#C98A2C', '💡'),
    (new_household_id, 'Salud', '#B3413D', '🩺'),
    (new_household_id, 'Educación', '#5B5FA6', '📚'),
    (new_household_id, 'Entretenimiento', '#8E4B8C', '🎬'),
    (new_household_id, 'Compras', '#B4587A', '🛍️'),
    (new_household_id, 'Viajes', '#2C8C86', '✈️'),
    (new_household_id, 'Suscripciones', '#C4652C', '🔁'),
    (new_household_id, 'Impuestos', '#6B6B63', '🧾'),
    (new_household_id, 'Otros', '#7A7A70', '✳️');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

do $$
declare
  existing_user record;
  new_household_id uuid;
begin
  for existing_user in
    select u.id, u.email, u.raw_user_meta_data
    from auth.users u
    left join public.profiles p on p.id = u.id
    where p.id is null
  loop
    insert into public.households (name)
    values ('Mi hogar')
    returning id into new_household_id;

    insert into public.household_members (household_id, user_id, role)
    values (new_household_id, existing_user.id, 'owner');

    insert into public.profiles (id, name, active_household_id)
    values (
      existing_user.id,
      coalesce(nullif(existing_user.raw_user_meta_data->>'name', ''), split_part(coalesce(existing_user.email, ''), '@', 1)),
      new_household_id
    );

    insert into public.categories (household_id, name, color, icon) values
      (new_household_id, 'Alimentación', '#3E7C59', '🍽️'),
      (new_household_id, 'Transporte', '#3B6E91', '🚌'),
      (new_household_id, 'Vivienda', '#8A5A3B', '🏠'),
      (new_household_id, 'Servicios', '#C98A2C', '💡'),
      (new_household_id, 'Salud', '#B3413D', '🩺'),
      (new_household_id, 'Educación', '#5B5FA6', '📚'),
      (new_household_id, 'Entretenimiento', '#8E4B8C', '🎬'),
      (new_household_id, 'Compras', '#B4587A', '🛍️'),
      (new_household_id, 'Viajes', '#2C8C86', '✈️'),
      (new_household_id, 'Suscripciones', '#C4652C', '🔁'),
      (new_household_id, 'Impuestos', '#6B6B63', '🧾'),
      (new_household_id, 'Otros', '#7A7A70', '✳️');
  end loop;
end;
$$;

-- ---------------------------------------------------------
-- Row Level Security: un usuario solo lee/escribe datos de los
-- hogares de los que es miembro. Esto es lo que garantiza que
-- nadie pueda acceder a los gastos de otra persona, sin importar
-- lo que haga (o tenga un bug) el código del frontend o la API.
-- ---------------------------------------------------------
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "select own profile" on public.profiles;
create policy "select own profile" on public.profiles
  for select using (id = auth.uid());
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (id = auth.uid());

drop policy if exists "select own memberships" on public.household_members;
create policy "select own memberships" on public.household_members
  for select using (user_id = auth.uid());
drop policy if exists "join a household as self" on public.household_members;
create policy "join a household as self" on public.household_members
  for insert with check (user_id = auth.uid());

drop policy if exists "select households you belong to" on public.households;
create policy "select households you belong to" on public.households
  for select using (
    id in (select household_id from public.household_members where user_id = auth.uid())
  );
drop policy if exists "create a household" on public.households;
create policy "create a household" on public.households
  for insert with check (true);

drop policy if exists "select categories of your households" on public.categories;
create policy "select categories of your households" on public.categories
  for select using (
    household_id in (select household_id from public.household_members where user_id = auth.uid())
  );
drop policy if exists "write categories of your households" on public.categories;
create policy "write categories of your households" on public.categories
  for insert with check (
    household_id in (select household_id from public.household_members where user_id = auth.uid())
  );
drop policy if exists "update categories of your households" on public.categories;
create policy "update categories of your households" on public.categories
  for update using (
    household_id in (select household_id from public.household_members where user_id = auth.uid())
  );
drop policy if exists "delete categories of your households" on public.categories;
create policy "delete categories of your households" on public.categories
  for delete using (
    household_id in (select household_id from public.household_members where user_id = auth.uid())
  );

drop policy if exists "select expenses of your households" on public.expenses;
create policy "select expenses of your households" on public.expenses
  for select using (
    household_id in (select household_id from public.household_members where user_id = auth.uid())
  );
drop policy if exists "insert expenses in your households" on public.expenses;
create policy "insert expenses in your households" on public.expenses
  for insert with check (
    household_id in (select household_id from public.household_members where user_id = auth.uid())
    and user_id = auth.uid()
  );
drop policy if exists "update expenses of your households" on public.expenses;
create policy "update expenses of your households" on public.expenses
  for update using (
    household_id in (select household_id from public.household_members where user_id = auth.uid())
  );
drop policy if exists "delete expenses of your households" on public.expenses;
create policy "delete expenses of your households" on public.expenses
  for delete using (
    household_id in (select household_id from public.household_members where user_id = auth.uid())
  );
