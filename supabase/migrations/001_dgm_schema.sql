-- DGM Commerce — schema base (auth, admin, account, wishlist)

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles / roles -----------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text unique,
  phone text,
  provider text not null default 'email',
  avatar_url text,
  terms_accepted_at timestamptz,
  marketing_opt_in boolean not null default false,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in ('guest', 'cliente', 'vendedor', 'admin')),
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, role_id)
);

create index if not exists user_roles_user_id_idx on public.user_roles(user_id);
create index if not exists user_roles_role_id_idx on public.user_roles(role_id);

insert into public.roles (name, description) values
  ('guest', 'Visitante no autenticado.'),
  ('cliente', 'Usuario autenticado que compra.'),
  ('vendedor', 'Personal de ventas con acceso al panel.'),
  ('admin', 'Administrador con acceso completo.')
on conflict (name) do update set description = excluded.description;

create or replace function public.user_has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = required_role
  );
$$;

create or replace function public.user_has_any_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = any(required_roles)
  );
$$;

create or replace function public.assign_default_cliente_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cliente_role_id uuid;
begin
  select id into cliente_role_id from public.roles where name = 'cliente';
  if cliente_role_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (new.id, cliente_role_id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists assign_default_cliente_role on public.profiles;
create trigger assign_default_cliente_role
after insert on public.profiles
for each row execute function public.assign_default_cliente_role();

-- Admin sales ----------------------------------------------------------------

create sequence if not exists public.admin_sales_number_seq start with 1001;

create table if not exists public.admin_sales (
  id text primary key default ('VEN-' || nextval('public.admin_sales_number_seq')),
  order_number text,
  placed_at date default current_date,
  customer_id text,
  customer_dni text,
  customer_address text,
  channel text not null check (channel in ('online', 'pos', 'whatsapp')),
  customer text not null,
  customer_type text check (customer_type in ('MAYORISTA', 'MINORISTA')),
  currency text default 'SOLES' check (currency in ('SOLES', 'DOLARES')),
  exchange_rate numeric(12,4) default 1,
  subtotal numeric(12,2),
  discount_total numeric(12,2) default 0,
  shipping_total numeric(12,2) default 0,
  tax_total numeric(12,2) default 0,
  amount numeric(12,2) not null,
  payment_status text,
  status text not null default 'Pendiente',
  source text check (source in ('web', 'instagram', 'whatsapp', 'store')),
  notes text,
  sales_rep_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_admin_sales_updated_at on public.admin_sales;
create trigger set_admin_sales_updated_at
before update on public.admin_sales
for each row execute function public.set_updated_at();

-- Inventory ------------------------------------------------------------------

create table if not exists public.admin_inventory_items (
  sku text primary key,
  parent_sku text,
  product_id integer,
  product text not null,
  summary text,
  description text,
  category text,
  collection text,
  subcollection text,
  color text,
  size text,
  options jsonb not null default '{}'::jsonb,
  price numeric(12,2),
  image text,
  images jsonb not null default '[]'::jsonb,
  on_hand integer not null default 0,
  reserved integer not null default 0,
  sold integer not null default 0,
  low_stock_threshold integer not null default 3,
  status text not null default 'active' check (status in ('active', 'draft', 'archived')),
  warehouse text not null default 'Principal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_inventory_items_parent_sku_idx on public.admin_inventory_items(parent_sku);
create index if not exists admin_inventory_items_product_id_idx on public.admin_inventory_items(product_id);
create index if not exists admin_inventory_items_category_idx on public.admin_inventory_items(category);
create index if not exists admin_inventory_items_collection_idx on public.admin_inventory_items(collection);
create index if not exists admin_inventory_items_subcollection_idx on public.admin_inventory_items(subcollection);
create index if not exists admin_inventory_items_options_gin_idx on public.admin_inventory_items using gin(options);

drop trigger if exists set_admin_inventory_items_updated_at on public.admin_inventory_items;
create trigger set_admin_inventory_items_updated_at
before update on public.admin_inventory_items
for each row execute function public.set_updated_at();

-- Sale items -----------------------------------------------------------------

create table if not exists public.admin_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id text not null references public.admin_sales(id) on delete cascade,
  product_id integer,
  parent_sku text,
  variant_sku text not null references public.admin_inventory_items(sku),
  product text not null,
  description text,
  color text,
  size text,
  quantity integer not null check (quantity > 0),
  stock_available integer,
  unit_price numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_sale_items_sale_id_idx on public.admin_sale_items(sale_id);
create index if not exists admin_sale_items_variant_sku_idx on public.admin_sale_items(variant_sku);

drop trigger if exists set_admin_sale_items_updated_at on public.admin_sale_items;
create trigger set_admin_sale_items_updated_at
before update on public.admin_sale_items
for each row execute function public.set_updated_at();

-- Contacts -------------------------------------------------------------------

create sequence if not exists public.admin_contacts_number_seq start with 1001;

create table if not exists public.admin_contacts (
  id text primary key default ('SUP-' || nextval('public.admin_contacts_number_seq')),
  document_type text not null check (document_type in ('DNI', 'CE', 'PASAPORTE', 'RUC', 'OTRO')),
  document text not null,
  last_name_paterno text not null,
  last_name_materno text not null,
  names text not null,
  sex text not null check (sex in ('MASCULINO', 'FEMENINO', 'OTRO')),
  birth_date date not null,
  numero text not null,
  classification text not null check (classification in ('MINORISTA', 'MAYORISTA')),
  client text not null,
  cellphone text not null,
  email text not null,
  province text not null,
  district text not null,
  department text not null,
  address text not null,
  address_number text not null,
  reference text not null,
  agency text not null,
  contacted_by text[] not null default '{}',
  contacted_by_other text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_admin_contacts_updated_at on public.admin_contacts;
create trigger set_admin_contacts_updated_at
before update on public.admin_contacts
for each row execute function public.set_updated_at();

-- Customer account -----------------------------------------------------------

create table if not exists public.account_orders (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  placed_at text not null,
  status text not null,
  total numeric(12,2) not null,
  shipping text,
  created_at timestamptz not null default now()
);

create table if not exists public.account_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.account_orders(id) on delete cascade,
  product_id integer not null,
  name text not null,
  quantity integer not null,
  price numeric(12,2) not null,
  image text,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id integer not null,
  name text not null,
  price numeric(12,2) not null,
  collection text not null,
  image text,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- RLS ------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.admin_sales enable row level security;
alter table public.admin_sale_items enable row level security;
alter table public.admin_inventory_items enable row level security;
alter table public.admin_contacts enable row level security;
alter table public.account_orders enable row level security;
alter table public.account_order_items enable row level security;
alter table public.wishlist_items enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.roles to anon, authenticated;
grant select on public.profiles, public.user_roles to authenticated;
grant insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.account_orders, public.account_order_items, public.wishlist_items to authenticated;
grant select, insert, update, delete on public.admin_sales, public.admin_sale_items, public.admin_inventory_items, public.admin_contacts to authenticated;
grant select on public.admin_inventory_items to anon, authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on function public.user_has_role(text) to authenticated;
grant execute on function public.user_has_any_role(text[]) to authenticated;

drop policy if exists "Roles are public readable" on public.roles;
create policy "Roles are public readable"
on public.roles for select to anon, authenticated using (true);

drop policy if exists "Users can read own roles" on public.user_roles;
create policy "Users can read own roles"
on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.user_has_role('admin'));

drop policy if exists "Admins manage user roles" on public.user_roles;
create policy "Admins manage user roles"
on public.user_roles for all to authenticated
using (public.user_has_role('admin'))
with check (public.user_has_role('admin'));

drop policy if exists "Users read own profile and staff read profiles" on public.profiles;
create policy "Users read own profile and staff read profiles"
on public.profiles for select to authenticated
using (id = auth.uid() or public.user_has_any_role(array['vendedor', 'admin']));

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile"
on public.profiles for insert to authenticated
with check (id = auth.uid());

drop policy if exists "Users update own profile and admins update profiles" on public.profiles;
create policy "Users update own profile and admins update profiles"
on public.profiles for update to authenticated
using (id = auth.uid() or public.user_has_role('admin'))
with check (id = auth.uid() or public.user_has_role('admin'));

drop policy if exists "Public can read active inventory" on public.admin_inventory_items;
create policy "Public can read active inventory"
on public.admin_inventory_items for select to anon, authenticated
using (status = 'active');

drop policy if exists "Sellers and admins manage inventory" on public.admin_inventory_items;
create policy "Sellers and admins manage inventory"
on public.admin_inventory_items for all to authenticated
using (public.user_has_any_role(array['vendedor', 'admin']))
with check (public.user_has_any_role(array['vendedor', 'admin']));

drop policy if exists "Sellers and admins manage sales" on public.admin_sales;
create policy "Sellers and admins manage sales"
on public.admin_sales for all to authenticated
using (public.user_has_any_role(array['vendedor', 'admin']))
with check (public.user_has_any_role(array['vendedor', 'admin']));

drop policy if exists "Sellers and admins manage sale items" on public.admin_sale_items;
create policy "Sellers and admins manage sale items"
on public.admin_sale_items for all to authenticated
using (public.user_has_any_role(array['vendedor', 'admin']))
with check (public.user_has_any_role(array['vendedor', 'admin']));

drop policy if exists "Sellers and admins manage contacts" on public.admin_contacts;
create policy "Sellers and admins manage contacts"
on public.admin_contacts for all to authenticated
using (public.user_has_any_role(array['vendedor', 'admin']))
with check (public.user_has_any_role(array['vendedor', 'admin']));

drop policy if exists "Customers read own account orders and staff read all" on public.account_orders;
create policy "Customers read own account orders and staff read all"
on public.account_orders for select to authenticated
using (user_id = auth.uid() or public.user_has_any_role(array['vendedor', 'admin']));

drop policy if exists "Sellers and admins manage account orders" on public.account_orders;
create policy "Sellers and admins manage account orders"
on public.account_orders for insert to authenticated
with check (public.user_has_any_role(array['vendedor', 'admin']));

drop policy if exists "Sellers and admins update account orders" on public.account_orders;
create policy "Sellers and admins update account orders"
on public.account_orders for update to authenticated
using (public.user_has_any_role(array['vendedor', 'admin']))
with check (public.user_has_any_role(array['vendedor', 'admin']));

drop policy if exists "Sellers and admins delete account orders" on public.account_orders;
create policy "Sellers and admins delete account orders"
on public.account_orders for delete to authenticated
using (public.user_has_any_role(array['vendedor', 'admin']));

drop policy if exists "Customers read own order items and staff read all" on public.account_order_items;
create policy "Customers read own order items and staff read all"
on public.account_order_items for select to authenticated
using (
  exists (
    select 1 from public.account_orders ao
    where ao.id = account_order_items.order_id
      and (ao.user_id = auth.uid() or public.user_has_any_role(array['vendedor', 'admin']))
  )
);

drop policy if exists "Sellers and admins manage order items" on public.account_order_items;
create policy "Sellers and admins manage order items"
on public.account_order_items for all to authenticated
using (public.user_has_any_role(array['vendedor', 'admin']))
with check (public.user_has_any_role(array['vendedor', 'admin']));

drop policy if exists "Customers manage own wishlist and staff read all" on public.wishlist_items;
create policy "Customers manage own wishlist and staff read all"
on public.wishlist_items for all to authenticated
using (user_id = auth.uid() or public.user_has_any_role(array['vendedor', 'admin']))
with check (user_id = auth.uid() or public.user_has_any_role(array['vendedor', 'admin']));

notify pgrst, 'reload schema';
