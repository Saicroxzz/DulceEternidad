-- ====================================================================
-- DULCE ETERNIDAD — SCRIPT COMPLETO DE CONFIGURACIÓN PARA SUPABASE
-- ====================================================================
-- Instrucciones:
-- 1. Ve a tu proyecto en Supabase (https://supabase.com).
-- 2. Abre el menú lateral "SQL Editor".
-- 3. Haz clic en "New query", pega todo este código y pulsa "Run".
-- ====================================================================

-- 1. CREACIÓN DE TABLAS

-- Tabla de Productos
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  occasion text,
  price numeric,
  description text,
  flowers text,
  size text,
  available boolean default true,
  featured boolean default false,
  images text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices de búsqueda y rendimiento
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_featured on public.products(featured);
create index if not exists idx_products_created_at on public.products(created_at desc);

-- Tabla de Configuración General
create table if not exists public.settings (
  id text primary key default 'general',
  whatsapp text default '',
  instagram text default 'dulce.eternidad7',
  hero_image text default 'https://lwatxuxsyxzjmbvupqhq.supabase.co/storage/v1/object/public/catalog-images/hero-flores-amarillas.png',
  config jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- 2. PERMISOS Y SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ====================================================================

-- Permisos base de esquema y tablas para roles de Supabase
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all routines in schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to postgres, anon, authenticated, service_role;

alter table public.products enable row level security;
alter table public.settings enable row level security;

-- Limpieza de políticas previas si existían
drop policy if exists "Lectura pública de productos" on public.products;
drop policy if exists "Inserción admin de productos" on public.products;
drop policy if exists "Actualización admin de productos" on public.products;
drop policy if exists "Eliminación admin de productos" on public.products;

drop policy if exists "Lectura pública de configuración" on public.settings;
drop policy if exists "Gestión admin de configuración" on public.settings;

-- Políticas para 'products':
-- 1. Lectura pública (Cualquier visitante puede ver el catálogo)
create policy "Lectura pública de productos"
  on public.products for select
  using (true);

-- 2. Modificaciones restringidas a usuarios autenticados (Admin)
create policy "Inserción admin de productos"
  on public.products for insert
  with check (auth.role() = 'authenticated');

create policy "Actualización admin de productos"
  on public.products for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Eliminación admin de productos"
  on public.products for delete
  using (auth.role() = 'authenticated');

-- Políticas para 'settings':
-- 1. Lectura pública
create policy "Lectura pública de configuración"
  on public.settings for select
  using (true);

-- 2. Modificación exclusiva de admin
create policy "Gestión admin de configuración"
  on public.settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ====================================================================
-- 3. ALMACENAMIENTO DE FOTOS (SUPABASE STORAGE)
-- ====================================================================

-- Crear el bucket público para fotos si no existe
insert into storage.buckets (id, name, public)
values ('catalog-images', 'catalog-images', true)
on conflict (id) do update set public = true;

-- Políticas de Storage
drop policy if exists "Imágenes de catálogo públicas" on storage.objects;
drop policy if exists "Subida de imágenes solo admin" on storage.objects;
drop policy if exists "Edición de imágenes solo admin" on storage.objects;
drop policy if exists "Eliminación de imágenes solo admin" on storage.objects;

-- Lectura pública para cualquier visitante
create policy "Imágenes de catálogo públicas"
  on storage.objects for select
  using (bucket_id = 'catalog-images');

-- Subida y gestión exclusiva para el administrador
create policy "Subida de imágenes solo admin"
  on storage.objects for insert
  with check (bucket_id = 'catalog-images' and auth.role() = 'authenticated');

create policy "Edición de imágenes solo admin"
  on storage.objects for update
  using (bucket_id = 'catalog-images' and auth.role() = 'authenticated');

create policy "Eliminación de imágenes solo admin"
  on storage.objects for delete
  using (bucket_id = 'catalog-images' and auth.role() = 'authenticated');

-- ====================================================================
-- 4. POBLADO INICIAL (SEMILLA) DE DATOS
-- ====================================================================

-- Configuración por defecto
insert into public.settings (id, whatsapp, instagram, hero_image, updated_at)
values (
  'general',
  '',
  'dulce.eternidad7',
  'https://lwatxuxsyxzjmbvupqhq.supabase.co/storage/v1/object/public/catalog-images/hero-flores-amarillas.png',
  now()
)
on conflict (id) do nothing;

-- Catálogo oficial de ramos en limpia pipas
insert into public.products (id, name, category, occasion, price, description, flowers, size, available, featured, images)
values
(
  'de-p1',
  'Ramo Amor Radiante',
  'Ramos',
  'Amor',
  85000,
  'Ramo floral artesanal elaborado a mano en técnica limpia pipas. Destaca un girasol central, rosas rojas y flores de acompañamiento con lazo satinado.',
  'Girasol, rosas rojas y flores de relleno en limpia pipas',
  'Mediano (aprox. 35 cm de alto)',
  true,
  true,
  array['https://lwatxuxsyxzjmbvupqhq.supabase.co/storage/v1/object/public/catalog-images/ramo-amor-radiante.jpeg']
),
(
  'de-p2',
  'Ramo 5 Gerberas',
  'Ramos',
  'Cumpleaños',
  75000,
  'Cinco gerberas amarillas artesanales tejidas con esmero en limpia pipas. Incluye mariposa dorada calada y lazo con detalle de corazones.',
  '5 gerberas amarillas y follaje en limpia pipas',
  'Mediano (aprox. 35 cm de alto)',
  true,
  true,
  array['https://lwatxuxsyxzjmbvupqhq.supabase.co/storage/v1/object/public/catalog-images/5-gerberas.jpeg']
),
(
  'de-p3',
  'Dúo de Amor',
  'Arreglos',
  'Amor',
  50000,
  'Arreglo dulce con dos rosas eternas en limpia pipas y corazón decorativo. Un obsequio ideal para sorprender o lucir en cualquier rincón.',
  'Dos rosas eternas en limpia pipas y follaje',
  'Pequeño (aprox. 25 cm de alto)',
  true,
  true,
  array['https://lwatxuxsyxzjmbvupqhq.supabase.co/storage/v1/object/public/catalog-images/duo-de-amor.jpeg']
),
(
  'de-p4',
  'Ramo Día de Sol',
  'Ramos',
  'Agradecimiento',
  80000,
  'Diseño alegre con girasol y flores en tonos amarillos y blancos sobre papel floral con borde dorado.',
  'Girasol, gerberas y follaje artesanal',
  'Mediano (aprox. 35 cm de alto)',
  true,
  false,
  array['https://lwatxuxsyxzjmbvupqhq.supabase.co/storage/v1/object/public/catalog-images/ramo-dia-de-sol.jpeg']
),
(
  'de-p5',
  'Ramo Eterno Encanto',
  'Ramos',
  'Aniversario',
  95000,
  'Ramo artesanal en tonos suaves y románticos, diseñado para recordar fechas inolvidables sin marchitarse.',
  'Rosas artesanales y flores variadas en limpia pipas',
  'Grande (aprox. 45 cm de alto)',
  true,
  false,
  array['https://lwatxuxsyxzjmbvupqhq.supabase.co/storage/v1/object/public/catalog-images/ramo-eterno-encanto.jpeg']
),
(
  'de-p6',
  'Ramo Mi Delirio',
  'Ramos',
  'Amor',
  90000,
  'Conjunto de rosas rojas eternas con follaje verde elaborado pacientemente a mano en limpia pipas.',
  'Rosas rojas artesanales y hojas verdes',
  'Mediano (aprox. 38 cm de alto)',
  true,
  false,
  array['https://lwatxuxsyxzjmbvupqhq.supabase.co/storage/v1/object/public/catalog-images/ramo-mi-delirio.jpeg']
),
(
  'de-p7',
  'Rosa Individual Eterna',
  'Regalos especiales',
  'Aniversario',
  25000,
  'Detalle individual con rosa hecha a mano en limpia pipas, presentada en cono decorativo con lazo. Lista para regalar.',
  'Rosa en limpia pipas y tallo con hojas',
  'Individual (aprox. 30 cm de alto)',
  true,
  false,
  array['https://lwatxuxsyxzjmbvupqhq.supabase.co/storage/v1/object/public/catalog-images/eterna.jpeg']
),
(
  'de-p8',
  'Arreglo Floral para Eventos',
  'Eventos',
  'Evento',
  null,
  'Centros de mesa y detalles florales a medida para celebraciones especiales. Cada proyecto se cotiza y adapta a la temática.',
  'A convenir según colores y temática del evento',
  'A medida',
  true,
  false,
  array['https://lwatxuxsyxzjmbvupqhq.supabase.co/storage/v1/object/public/catalog-images/ramo-eterno-encanto.jpeg']
)
on conflict (id) do nothing;
