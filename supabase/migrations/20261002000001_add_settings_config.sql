-- Migración para añadir columna de configuración extendida
alter table public.settings add column if not exists config jsonb default '{}'::jsonb;
