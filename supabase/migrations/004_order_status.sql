-- Order status is configurable from Admin → Settings (not a fixed enum).
-- Keep payment_status for backward compatibility; app syncs it from order status.

alter table public.admin_sales drop constraint if exists admin_sales_status_check;
alter table public.admin_sales drop constraint if exists admin_sales_payment_status_check;

-- Ensure Enviado / custom labels can be stored.
alter table public.admin_sales
  alter column status set default 'Pendiente';
