# Setup Supabase — DGM Commerce

Guía para un proyecto **nuevo** (no reutilizar el de Yorusitos).

## 1. Crear el proyecto

1. Entra a [supabase.com](https://supabase.com) → **New project**
2. Nombre sugerido: `dgm-commerce`
3. Elige región cercana y guarda la DB password

## 2. Copiar API keys

En **Project Settings → API**:

| Variable | Dónde |
|----------|--------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` | `SUPABASE_SERVICE_ROLE_KEY` (secreto, solo server) |

Crea/actualiza `.env` en la raíz del repo (parte de `.env.example`).

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**No** dejes `CATALOG_SYNC_FROM_MOCK=true` salvo que quieras forzar el mock al inventario.

## 3. Aplicar schema + seed

En **SQL Editor**, ejecuta en orden:

1. `supabase/migrations/001_dgm_schema.sql` — tablas, roles, RLS
2. `supabase/migrations/002_dgm_demo_products.sql` — 8 productos de prueba (40 variantes)
3. `supabase/migrations/003_store_cms_and_product_seo.sql` — CMS de tienda + SEO por producto

## 4. Auth (Google / email)

En **Authentication → Providers**:

- Habilita **Email**
- (Opcional) Google / Facebook con redirect:

```
http://localhost:3000/auth/callback
```

En producción añade también `https://tu-dominio.com/auth/callback`.

## 5. Primer admin

1. Regístrate en la tienda (`/register`) o crea un user en Auth
2. En SQL Editor, asigna rol admin:

```sql
insert into public.user_roles (user_id, role_id)
select p.id, r.id
from public.profiles p
cross join public.roles r
where p.email = 'tu-email@ejemplo.com'
  and r.name = 'admin'
on conflict do nothing;
```

## 6. Verificar

```bash
npm run dev
```

- `/products` → Classic Tee, Oversized Tee, Hoodies, Pants, Cap, Tote
- `/admin/inventory` → mismos SKUs (ESS-001…, OUT-003…, BOT-005…, ACC-007…)
- Sin productos BTS / Cristiano / Yorusito

## Notas

- El sync automático del mock está **apagado** por defecto.
- Puedes crear más productos solo desde el admin.
- Cuando tengas las keys, avisa y te ayudo a validar la conexión.
