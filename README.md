# DGM Commerce

Template SaaS de catálogo y venta de ropa, clonado desde la estructura de Yorusitos.

Stack: Next.js 15, React 19, Tailwind, Supabase.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## White-label

La marca vive en `src/config/brand.ts` (`name`, logos, emails, redes, keys de storage).  
Las secciones de la tienda se irán generalizando desde ahí para multi-tenant.

## Scripts útiles

| Script | Uso |
|--------|-----|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
