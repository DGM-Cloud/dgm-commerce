-- Store CMS (single row per deployment) + product SEO fields on inventory

create table if not exists public.store_cms (
  id text primary key default 'default',
  seo jsonb not null default '{}'::jsonb,
  home jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_store_cms_updated_at on public.store_cms;
create trigger set_store_cms_updated_at
before update on public.store_cms
for each row execute function public.set_updated_at();

insert into public.store_cms (id, seo, home)
values ('default', '{}'::jsonb, '{}'::jsonb)
on conflict (id) do nothing;

alter table public.store_cms enable row level security;

drop policy if exists "Public can read store cms" on public.store_cms;
create policy "Public can read store cms"
on public.store_cms for select
to anon, authenticated
using (true);

drop policy if exists "Sellers and admins manage store cms" on public.store_cms;
create policy "Sellers and admins manage store cms"
on public.store_cms for all
to authenticated
using (public.user_has_any_role(array['vendedor', 'admin']))
with check (public.user_has_any_role(array['vendedor', 'admin']));

grant select on public.store_cms to anon, authenticated;
grant select, insert, update, delete on public.store_cms to authenticated;

-- Product SEO columns on inventory variants
alter table public.admin_inventory_items
  add column if not exists seo_slug text,
  add column if not exists seo_title text,
  add column if not exists seo_description text;
