-- ============================================================
-- BOX MANAGER — SQL PARTE 1 de 2
-- Tablas, funciones, triggers y datos iniciales
-- Pega esto en Supabase > SQL Editor > New Query > RUN
-- ============================================================
-- Kenny Vianey Vargas Segura
-- Administradora de Empresas · Máster en Project Management
-- con Mención en Business Analytics
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- TABLAS
-- ------------------------------------------------------------

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

create table if not exists usuarios_sistema (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  rol         text not null check (rol in ('dueño','colaborador')),
  initiales   text,
  activo      boolean default true,
  created_at  timestamptz default now()
);

create table if not exists planes (
  id                uuid primary key default uuid_generate_v4(),
  nombre            text not null,
  descripcion       text,
  precio            numeric(10,0) not null default 120000,
  duracion_dias     int not null default 30,
  max_beneficiarios int not null default 1,
  tipo              text default 'general' check (tipo in ('general','personal','grupal')),
  creado_por        text default 'dueño',
  activo            boolean default true,
  color             text default 'blue',
  created_at        timestamptz default now()
);

create table if not exists atletas (
  id                     uuid primary key default uuid_generate_v4(),
  cc                     text not null unique,
  nombre                 text not null,
  edad                   int,
  peso_inicial           numeric(5,1),
  peso_actual            numeric(5,1),
  correo                 text,
  whatsapp               text,
  fecha_inicio           date default current_date,
  activo                 boolean default true,
  plan_id                uuid references planes(id),
  enfermedades           text,
  condiciones_especiales text,
  lesiones               text,
  med_cuello             numeric(5,1),
  med_brazo              numeric(5,1),
  med_torax              numeric(5,1),
  med_cintura            numeric(5,1),
  med_cadera             numeric(5,1),
  med_muslo              numeric(5,1),
  emerg_nombre           text,
  emerg_relacion         text,
  emerg_telefono         text,
  acepto_reglamento      boolean default false,
  acepto_consentimiento  boolean default false,
  fecha_aceptacion       timestamptz,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

create table if not exists grupos (
  id         uuid primary key default uuid_generate_v4(),
  nombre     text not null,
  plan_id    uuid references planes(id),
  created_at timestamptz default now()
);

create table if not exists grupo_miembros (
  grupo_id  uuid references grupos(id) on delete cascade,
  atleta_id uuid references atletas(id) on delete cascade,
  primary key (grupo_id, atleta_id)
);

create table if not exists pagos (
  id             uuid primary key default uuid_generate_v4(),
  atleta_id      uuid references atletas(id),
  grupo_id       uuid references grupos(id),
  plan_id        uuid references planes(id),
  monto          numeric(10,0) not null,
  fecha_pago     date not null default current_date,
  fecha_vence    date not null,
  estado         text default 'pagado' check (estado in ('pagado','pendiente','vencido')),
  metodo         text default 'Efectivo',
  registrado_por uuid references usuarios_sistema(id),
  created_at     timestamptz default now()
);

create table if not exists accesos (
  id             uuid primary key default uuid_generate_v4(),
  atleta_id      uuid references atletas(id),
  cc             text not null,
  nombre         text,
  fecha          date not null default current_date,
  hora           time not null default current_time,
  registrado_por uuid references usuarios_sistema(id),
  created_at     timestamptz default now()
);

create table if not exists rutinas (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text,
  tipos       text[],
  categorias  text[],
  duracion    int default 20,
  descripcion text,
  fecha       date default current_date,
  creado_por  uuid references usuarios_sistema(id),
  created_at  timestamptz default now()
);

create table if not exists clases (
  id         uuid primary key default uuid_generate_v4(),
  nombre     text not null,
  fecha      date not null default current_date,
  estado     text not null default 'pendiente'
             check (estado in ('pendiente','activa','pausada','completada')),
  creado_por uuid references usuarios_sistema(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists clase_atletas (
  clase_id  uuid references clases(id) on delete cascade,
  atleta_id uuid references atletas(id) on delete cascade,
  primary key (clase_id, atleta_id)
);

create table if not exists clase_fases (
  id           uuid primary key default uuid_generate_v4(),
  clase_id     uuid references clases(id) on delete cascade,
  orden        int not null default 1,
  nombre       text not null,
  tipo         text not null default 'Libre',
  duracion_min int not null default 10,
  series       int not null default 0,
  descripcion  text,
  created_at   timestamptz default now()
);

create table if not exists clase_progreso (
  id                 uuid primary key default uuid_generate_v4(),
  clase_id           uuid references clases(id) on delete cascade,
  fase_id            uuid references clase_fases(id) on delete cascade,
  atleta_id          uuid references atletas(id) on delete cascade,
  series_completadas boolean[] default '{}',
  fase_completada    boolean default false,
  nota_instructor    text,
  updated_at         timestamptz default now(),
  unique (clase_id, fase_id, atleta_id)
);

create table if not exists clase_estado_timer (
  clase_id           uuid primary key references clases(id) on delete cascade,
  fase_actual        int not null default 0,
  timer_inicio       timestamptz,
  timer_pausado      boolean default true,
  segundos_restantes int,
  updated_at         timestamptz default now()
);

create table if not exists sesiones (
  id             uuid primary key default uuid_generate_v4(),
  atleta_id      uuid references atletas(id),
  rutina_id      uuid references rutinas(id),
  clase_id       uuid references clases(id),
  fecha          date default current_date,
  tiempo         text,
  rondas         int,
  reps           int,
  peso_levantado numeric(6,1),
  peso_obs       text,
  escala         text default 'rx' check (escala in ('rx','scaled','modificado')),
  tipo_registro  text default 'individual' check (tipo_registro in ('individual','clase')),
  notas          text,
  registrado_por uuid references usuarios_sistema(id),
  created_at     timestamptz default now()
);

create table if not exists mediciones (
  id             uuid primary key default uuid_generate_v4(),
  atleta_id      uuid references atletas(id),
  fecha          date not null default current_date,
  peso           numeric(5,1),
  med_cuello     numeric(5,1),
  med_brazo      numeric(5,1),
  med_torax      numeric(5,1),
  med_cintura    numeric(5,1),
  med_cadera     numeric(5,1),
  med_muslo      numeric(5,1),
  notas          text,
  registrado_por uuid references usuarios_sistema(id),
  created_at     timestamptz default now()
);

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

create table if not exists ventas (
  id               uuid primary key default uuid_generate_v4(),
  producto_id      uuid references productos(id),
  cantidad         int not null default 1,
  total            numeric(10,0) not null,
  atleta_id        uuid references atletas(id),
  cc_cliente       text,
  metodo           text default 'Efectivo',
  es_fiado         boolean default false,
  fiado_pagado     boolean default false,
  fecha_pago_fiado date,
  registrado_por   uuid references usuarios_sistema(id),
  created_at       timestamptz default now()
);

create table if not exists gastos (
  id             uuid primary key default uuid_generate_v4(),
  concepto       text not null,
  monto          numeric(10,0) not null,
  categoria      text default 'Variable' check (categoria in ('Fijo','Variable')),
  fecha          date default current_date,
  registrado_por uuid references usuarios_sistema(id),
  created_at     timestamptz default now()
);

create table if not exists politicas_box (
  id             uuid primary key default uuid_generate_v4(),
  reglamento     text,
  consentimiento text,
  updated_at     timestamptz default now()
);

-- ------------------------------------------------------------
-- SEGURIDAD (Row Level Security)
-- ------------------------------------------------------------

alter table atletas            enable row level security;
alter table accesos            enable row level security;
alter table pagos              enable row level security;
alter table rutinas            enable row level security;
alter table clases             enable row level security;
alter table clase_atletas      enable row level security;
alter table clase_fases        enable row level security;
alter table clase_progreso     enable row level security;
alter table clase_estado_timer enable row level security;
alter table sesiones           enable row level security;
alter table mediciones         enable row level security;
alter table productos          enable row level security;
alter table ventas             enable row level security;
alter table gastos             enable row level security;
alter table configuracion_box  enable row level security;
alter table politicas_box      enable row level security;

create policy "acceso_atletas"            on atletas            for all using (auth.role() = 'authenticated');
create policy "acceso_accesos"            on accesos            for all using (auth.role() = 'authenticated');
create policy "acceso_pagos"              on pagos              for all using (auth.role() = 'authenticated');
create policy "acceso_rutinas"            on rutinas            for all using (auth.role() = 'authenticated');
create policy "acceso_clases"             on clases             for all using (auth.role() = 'authenticated');
create policy "acceso_clase_atletas"      on clase_atletas      for all using (auth.role() = 'authenticated');
create policy "acceso_clase_fases"        on clase_fases        for all using (auth.role() = 'authenticated');
create policy "acceso_clase_progreso"     on clase_progreso     for all using (auth.role() = 'authenticated');
create policy "acceso_clase_timer"        on clase_estado_timer for all using (auth.role() = 'authenticated');
create policy "acceso_sesiones"           on sesiones           for all using (auth.role() = 'authenticated');
create policy "acceso_mediciones"         on mediciones         for all using (auth.role() = 'authenticated');
create policy "acceso_productos"          on productos          for all using (auth.role() = 'authenticated');
create policy "acceso_ventas"             on ventas             for all using (auth.role() = 'authenticated');
create policy "acceso_gastos"             on gastos             for all using (auth.role() = 'authenticated');
create policy "acceso_configuracion"      on configuracion_box  for all using (auth.role() = 'authenticated');
create policy "acceso_politicas"          on politicas_box      for all using (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- FUNCIONES
-- ------------------------------------------------------------

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function registrar_progreso_fase(
  p_clase_id   uuid,
  p_fase_id    uuid,
  p_atleta_id  uuid,
  p_series     boolean[],
  p_completada boolean
)
returns void language plpgsql as $$
begin
  insert into clase_progreso
    (clase_id, fase_id, atleta_id, series_completadas, fase_completada, updated_at)
  values
    (p_clase_id, p_fase_id, p_atleta_id, p_series, p_completada, now())
  on conflict (clase_id, fase_id, atleta_id) do update set
    series_completadas = excluded.series_completadas,
    fase_completada    = excluded.fase_completada,
    updated_at         = now();
end;
$$;

create or replace function sincronizar_timer(
  p_clase_id    uuid,
  p_fase_actual int,
  p_segundos    int,
  p_activo      boolean
)
returns void language plpgsql as $$
begin
  insert into clase_estado_timer
    (clase_id, fase_actual, timer_inicio, timer_pausado, segundos_restantes, updated_at)
  values (
    p_clase_id, p_fase_actual,
    case when p_activo then now() else null end,
    not p_activo, p_segundos, now()
  )
  on conflict (clase_id) do update set
    fase_actual        = excluded.fase_actual,
    timer_inicio       = excluded.timer_inicio,
    timer_pausado      = excluded.timer_pausado,
    segundos_restantes = excluded.segundos_restantes,
    updated_at         = now();
end;
$$;

create or replace function finalizar_clase(p_clase_id uuid)
returns void language plpgsql as $$
declare
  v_clase       record;
  v_atleta      record;
  v_fases       int;
  v_completadas int;
begin
  update clases
    set estado = 'completada', updated_at = now()
  where id = p_clase_id;

  select * into v_clase from clases where id = p_clase_id;
  select count(*) into v_fases from clase_fases where clase_id = p_clase_id;

  for v_atleta in
    select ca.atleta_id, a.cc, a.nombre
    from clase_atletas ca
    join atletas a on a.id = ca.atleta_id
    where ca.clase_id = p_clase_id
  loop
    select count(*) into v_completadas
    from clase_progreso
    where clase_id  = p_clase_id
      and atleta_id = v_atleta.atleta_id
      and (fase_completada = true
           or array_length(series_completadas, 1) > 0);

    insert into sesiones (
      atleta_id, clase_id, fecha,
      rondas, notas, tipo_registro, escala
    ) values (
      v_atleta.atleta_id, p_clase_id, v_clase.fecha,
      v_completadas,
      'Clase: ' || v_clase.nombre || ' · '
        || v_completadas || '/' || v_fases || ' fases completadas',
      'clase', 'rx'
    );
  end loop;
end;
$$;

create or replace function dias_para_vencer(p_atleta_id uuid)
returns int language sql as $$
  select extract(day from (
    select max(fecha_vence)::timestamptz - now()
    from pagos
    where atleta_id = p_atleta_id
      and estado = 'pagado'
  ))::int;
$$;

create or replace function accesos_del_mes(p_atleta_id uuid)
returns int language sql as $$
  select count(*)::int
  from accesos
  where atleta_id = p_atleta_id
    and date_trunc('month', fecha::timestamptz) = date_trunc('month', now());
$$;

-- ------------------------------------------------------------
-- TRIGGERS
-- ------------------------------------------------------------

create trigger atletas_updated_at
  before update on atletas
  for each row execute function set_updated_at();

create trigger productos_updated_at
  before update on productos
  for each row execute function set_updated_at();

create trigger clases_updated_at
  before update on clases
  for each row execute function set_updated_at();

create trigger clase_progreso_updated
  before update on clase_progreso
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- DATOS INICIALES
-- ------------------------------------------------------------

insert into planes (nombre, descripcion, precio, duracion_dias, max_beneficiarios, tipo, creado_por, color)
values
  ('General',       'Plan estándar con coach colaborador',  120000, 30, 1, 'general',  'colaborador', 'blue'),
  ('Personalizado', 'Entrenamiento directo con el dueño',   200000, 30, 1, 'personal', 'dueño',       'accent'),
  ('Pareja',        'Plan compartido para dos personas',    210000, 30, 2, 'grupal',   'dueño',       'green'),
  ('Familia',       'Plan para grupos de 3 o más personas', 280000, 30, 5, 'grupal',   'dueño',       'purple')
on conflict do nothing;

insert into configuracion_box (nombre_box, tagline)
values ('Mi BOX CrossFit', 'Sistema de gestión CrossFit')
on conflict do nothing;

insert into politicas_box (reglamento, consentimiento)
values (
  'REGLAMENTO INTERNO DEL BOX',
  'CONSENTIMIENTO INFORMADO'
)
on conflict do nothing;
