# Backend Boundary

`src/backend` contiene la lógica server-side del proyecto.

## Qué va aquí

- utilidades de sesión y autenticación
- acceso a datos del backend
- funciones que dependen de cookies, `headers`, `process.env` o validación server-side

## Qué va fuera

- componentes React
- hooks
- UI y forms del cliente

## Contratos actuales

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/account/profile`
- `GET /api/account/orders`
- `GET /api/account/wishlist`

## Nota

El login y el registro aceptan cualquier credencial por ahora. La estructura ya queda lista para conectar validación real, base de datos y sesiones persistentes.
