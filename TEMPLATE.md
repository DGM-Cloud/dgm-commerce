# DGM Commerce — notas para desarrollo

Documento **interno** (no se muestra en la tienda).

## Audiencia de la web

El storefront es una **demo de tienda de ropa** para cliente final / prospecto comercial.  
Todo el copy visible vive en `src/config/brand.ts` y `src/config/site-content.ts` y debe sonar a marca de ropa, nunca a documentación técnica.

## Rutas storefront

| Ruta | Rol |
|------|-----|
| `/` | Home |
| `/products` | Catálogo (`?category=&collection=&q=`) |
| `/products/[slug]` | Ficha con SEO |
| `/cart`, `/checkout` | Compra |
| `/login`, `/register`, `/auth/callback` | Auth |
| `/account/*` | Cuenta |
| `/about`, `/faq`, `/contact`, `/terms` | Contenido |
| `/admin/*` | Backoffice (no es cliente final) |

## SEO (implementación)

Al mapear un producto: slug, seoTitle, seoDescription, canonical, JSON-LD, sitemap/robots.  
Overrides opcionales en inventario: `seoSlug`, `seoTitle`, `seoDescription`.

## White-label técnico

1. Logos / brand base en `brand.ts` (identidad técnica)
2. Proyecto Supabase **nuevo** — ver `docs/SETUP_SUPABASE.md`
3. Migraciones: `001` schema + `002` demo products + `003` store CMS / product SEO
4. Contenido home + SEO global: `/admin/store` (persiste en `store_cms`)
5. SEO por producto: al crear/editar en Inventario (slug, title, description)
6. No uses el `.env` de Yorusitos; no actives `CATALOG_SYNC_FROM_MOCK` salvo necesidad
