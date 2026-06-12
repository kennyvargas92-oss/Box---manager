-- ============================================================
-- BOX MANAGER — Esquema completo de base de datos
-- Supabase / PostgreSQL
-- Desarrollado por Kenny Vianey Vargas Segura
-- ============================================================
-- Ejecuta este archivo en: Supabase > SQL Editor > New Query

-- EXTENSIONES
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLA: configuracion_box
-- ============================================================
create table if not exists configuracion_box (
  id            uuid primary key default uuid_generate_v4(),
  nombre_box    text not null default 'BOX Manager',
  tagline       text default 'Sistema de gestión CrossFit',
  logo_url      text,
  color_accent  text default '#e8430a',
  color_accent2 text default '#ff5a1f',
  paleta        text default 'naranja',
  instagram     text,
  facebook      text,
  whatsapp      text,
  telefono      text,
  email         text,
  ciudad        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- TABLA: usuarios_sistema (dueño, colaboradores)
-- Usa el auth de Supabase integrado
-- ============================================================
create table if not exists usuarios_sistema (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  rol         text not null check (rol in ('dueño','colaborador')),
  initiales   text,
  activo      boolean default true,
  created_at  timestamptz default now()
);

-- ============================================================
-- TABLA: planes
-- ============================================================
create table if not exists planes (
  id                  uuid primary key default uuid_generate_v4(),
  nombre              text not null,
  descripcion         text,
  precio              numeric(10,0) not null default 120000,
  duracion_dias       int not null default 30,
  max_beneficiarios   int not null default 1,
  tipo                text default 'general' check (tipo in ('general','personal','grupal')),
  creado_por          text default 'dueño',
  activo              boolean default true,
  color               text default 'blue',
  created_at          timestamptz default now()
);

-- ============================================================
-- TABLA: atletas
-- ============================================================
create table if not exists atletas (
  id                    uuid primary key default uuid_generate_v4(),
  cc                    text not null unique,
  nombre                text not null,
  edad                  int,
  peso_inicial          numeric(5,1),
  peso_actual           numeric(5,1),
  correo                text,
  whatsapp              text,
  fecha_inicio          date default current_date,
  activo                boolean default true,
  plan_id               uuid references planes(id),
  -- Salud
  enfermedades          text,
  condiciones_especiales text,
  lesiones              text,
  -- Medidas corporales iniciales
  med_cuello            numeric(5,1),
  med_brazo             numeric(5,1),
  med_torax             numeric(5,1),
  med_cintura           numeric(5,1),
  med_cadera            numeric(5,1),
  med_muslo             numeric(5,1),
  -- Contacto emergencia
  emerg_nombre          text,
  emerg_relacion        text,
  emerg_telefono        text,
  -- Políticas
  acepto_reglamento     boolean default false,
  acepto_consentimiento boolean default false,
  fecha_aceptacion      timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ============================================================
-- TABLA: grupos (planes compartidos)
-- ============================================================
create table if not exists grupos (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  plan_id     uuid references planes(id),
  created_at  timestamptz default now()
);

create table if not exists grupo_miembros (
  grupo_id    uuid references grupos(id) on delete cascade,
  atleta_id   uuid references atletas(id) on delete cascade,
  primary key (grupo_id, atleta_id)
);

-- ============================================================
-- TABLA: pagos
-- ============================================================
create table if not exists pagos (
  id          uuid primary key default uuid_generate_v4(),
  atleta_id   uuid references atletas(id),
  grupo_id    uuid references grupos(id),
  plan_id     uuid references planes(id),
  monto       numeric(10,0) not null,
  fecha_pago  date not null default current_date,
  fecha_vence date not null,
  estado      text default 'pagado' check (estado in ('pagado','pendiente','vencido')),
  metodo      text default 'Efectivo',
  registrado_por uuid references usuarios_sistema(id),
  created_at  timestamptz default now()
);

-- ============================================================
-- TABLA: accesos
-- ============================================================
create table if not exists accesos (
  id          uuid primary key default uuid_generate_v4(),
  atleta_id   uuid references atletas(id),
  cc          text not null,
  nombre      text,
  fecha       date not null default current_date,
  hora        time not null default current_time,
  registrado_por uuid references usuarios_sistema(id),
  created_at  timestamptz default now()
);

-- ============================================================
-- TABLA: rutinas (WODs)
-- ============================================================
create table if not exists rutinas (
  id            uuid primary key default uuid_generate_v4(),
  nombre        text,
  tipos         text[],
  categorias    text[],
  duracion      int default 20,
  descripcion   text,
  fecha         date default current_date,
  creado_por    uuid references usuarios_sistema(id),
  created_at    timestamptz default now()
);

-- ============================================================
-- TABLA: sesiones (resultados individuales de rutinas)
-- ============================================================
create table if not exists sesiones (
  id              uuid primary key default uuid_generate_v4(),
  atleta_id       uuid references atletas(id),
  rutina_id       uuid references rutinas(id),
  fecha           date default current_date,
  tiempo          text,
  rondas          int,
  reps            int,
  peso_levantado  numeric(6,1),
  peso_obs        text,
  escala          text default 'rx' check (escala in ('rx','scaled','modificado')),
  notas           text,
  registrado_por  uuid references usuarios_sistema(id),
  created_at      timestamptz default now()
);

-- ============================================================
-- TABLA: mediciones (progreso físico)
-- ============================================================
create table if not exists mediciones (
  id          uuid primary key default uuid_generate_v4(),
  atleta_id   uuid references atletas(id),
  fecha       date not null default current_date,
  peso        numeric(5,1),
  med_cuello  numeric(5,1),
  med_brazo   numeric(5,1),
  med_torax   numeric(5,1),
  med_cintura numeric(5,1),
  med_cadera  numeric(5,1),
  med_muslo   numeric(5,1),
  notas       text,
  registrado_por uuid references usuarios_sistema(id),
  created_at  timestamptz default now()
);

-- ============================================================
-- TABLA: productos (tienda)
-- ============================================================
create table if not exists productos (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  categoria   text not null,
  precio      numeric(10,0) not null,
  costo       numeric(10,0),
  stock       int not null default 0,
  stock_min   int default 3,
  tallas      text[],
  activo      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- TABLA: ventas (tienda)
-- ============================================================
create table if not exists ventas (
  id          uuid primary key default uuid_generate_v4(),
  producto_id uuid references productos(id),
  cantidad    int not null default 1,
  total       numeric(10,0) not null,
  atleta_id   uuid references atletas(id),
  cc_cliente  text,
  metodo      text default 'Efectivo',
  es_fiado    boolean default false,
  fiado_pagado boolean default false,
  fecha_pago_fiado date,
  registrado_por uuid references usuarios_sistema(id),
  created_at  timestamptz default now()
);

-- ============================================================
-- TABLA: gastos
-- ============================================================
create table if not exists gastos (
  id          uuid primary key default uuid_generate_v4(),
  concepto    text not null,
  monto       numeric(10,0) not null,
  categoria   text default 'Variable' check (categoria in ('Fijo','Variable')),
  fecha       date default current_date,
  registrado_por uuid references usuarios_sistema(id),
  created_at  timestamptz default now()
);

-- ============================================================
-- TABLA: politicas_box
-- ============================================================
create table if not exists politicas_box (
  id                uuid primary key default uuid_generate_v4(),
  reglamento        text,
  consentimiento    text,
  updated_at        timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — seguridad de datos
-- ============================================================
alter table atletas           enable row level security;
alter table accesos           enable row level security;
alter table pagos             enable row level security;
alter table rutinas           enable row level security;
alter table sesiones          enable row level security;
alter table mediciones        enable row level security;
alter table productos         enable row level security;
alter table ventas            enable row level security;
alter table gastos            enable row level security;
alter table configuracion_box enable row level security;
alter table politicas_box     enable row level security;

-- Políticas: usuarios autenticados pueden leer y escribir
create policy "Autenticados pueden ver atletas"
  on atletas for all using (auth.role() = 'authenticated');

create policy "Autenticados pueden ver accesos"
  on accesos for all using (auth.role() = 'authenticated');

create policy "Autenticados pueden ver pagos"
  on pagos for all using (auth.role() = 'authenticated');

create policy "Autenticados pueden ver rutinas"
  on rutinas for all using (auth.role() = 'authenticated');

create policy "Autenticados pueden ver sesiones"
  on sesiones for all using (auth.role() = 'authenticated');

create policy "Autenticados pueden ver mediciones"
  on mediciones for all using (auth.role() = 'authenticated');

create policy "Autenticados pueden ver productos"
  on productos for all using (auth.role() = 'authenticated');

create policy "Autenticados pueden ver ventas"
  on ventas for all using (auth.role() = 'authenticated');

create policy "Autenticados pueden ver gastos"
  on gastos for all using (auth.role() = 'authenticated');

create policy "Autenticados pueden ver config"
  on configuracion_box for all using (auth.role() = 'authenticated');

create policy "Autenticados pueden ver politicas"
  on politicas_box for all using (auth.role() = 'authenticated');

-- ============================================================
-- DATOS INICIALES
-- ============================================================
insert into planes (nombre, descripcion, precio, duracion_dias, max_beneficiarios, tipo, creado_por, color)
values
  ('General',      'Plan estándar con coach colaborador',   120000, 30, 1, 'general',  'colaborador', 'blue'),
  ('Personalizado','Entrenamiento directo con el dueño',    200000, 30, 1, 'personal', 'dueño',       'accent'),
  ('Pareja',       'Plan compartido para dos personas',     210000, 30, 2, 'grupal',   'dueño',       'green'),
  ('Familia',      'Plan para grupos de 3 o más personas',  280000, 30, 5, 'grupal',   'dueño',       'purple')
on conflict do nothing;

insert into configuracion_box (nombre_box, tagline)
values ('Mi BOX CrossFit', 'Sistema de gestión CrossFit')
on conflict do nothing;

insert into politicas_box (reglamento, consentimiento)
values (
  'REGLAMENTO INTERNO DEL BOX' || chr(10) || chr(10) ||
  '1. El BOX se reserva el derecho de admisión.' || chr(10) ||
  '2. Los atletas deben respetar los equipos y el espacio.' || chr(10) ||
  '3. Horario de atención: lunes a sábado. Sin servicio los domingos.' || chr(10) ||
  '4. Se requiere indumentaria deportiva apropiada.',
  'CONSENTIMIENTO INFORMADO' || chr(10) || chr(10) ||
  'Declaro que mi estado de salud me permite realizar actividad física de alta intensidad.' || chr(10) ||
  'He informado al coach sobre cualquier condición médica relevante.' || chr(10) ||
  'Entiendo y acepto los riesgos inherentes al CrossFit.'
) on conflict do nothing;

-- ============================================================
-- FUNCIONES ÚTILES
-- ============================================================

-- Función: calcular días para vencer el pago de un atleta
create or replace function dias_para_vencer(p_atleta_id uuid)
returns int language sql as $$
  select extract(day from (
    select max(fecha_vence)::timestamptz - now()
    from pagos
    where atleta_id = p_atleta_id
    and estado = 'pagado'
  ))::int;
$$;

-- Función: contar accesos del mes de un atleta
create or replace function accesos_del_mes(p_atleta_id uuid)
returns int language sql as $$
  select count(*)::int
  from accesos
  where atleta_id = p_atleta_id
  and date_trunc('month', fecha::timestamptz) = date_trunc('month', now());
$$;

-- Trigger: actualizar updated_at automáticamente
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger atletas_updated_at
  before update on atletas
  for each row execute function set_updated_at();

create trigger productos_updated_at
  before update on productos
  for each row execute function set_updated_at();
