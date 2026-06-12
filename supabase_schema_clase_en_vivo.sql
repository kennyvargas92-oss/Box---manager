-- ============================================================
-- BOX MANAGER — Parche de base de datos: Módulo Clase en vivo
-- Ejecutar en: Supabase > SQL Editor > New Query
-- Este archivo complementa supabase_schema.sql
-- NO borra nada existente — solo agrega tablas y columnas nuevas
-- ============================================================

-- ============================================================
-- 1. TABLA: clases
--    Una clase es la ejecución de una sesión de entrenamiento
--    en un día específico con atletas reales
-- ============================================================
create table if not exists clases (
  id            uuid primary key default uuid_generate_v4(),
  nombre        text not null,
  fecha         date not null default current_date,
  estado        text not null default 'pendiente'
                check (estado in ('pendiente','activa','pausada','completada')),
  creado_por    uuid references usuarios_sistema(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- 2. TABLA: clase_atletas
--    Atletas inscritos en una clase
-- ============================================================
create table if not exists clase_atletas (
  clase_id      uuid references clases(id) on delete cascade,
  atleta_id     uuid references atletas(id) on delete cascade,
  primary key (clase_id, atleta_id)
);

-- ============================================================
-- 3. TABLA: clase_fases
--    Fases de una clase (estiramiento, calentamiento, WOD, etc.)
--    en orden definido por el instructor
-- ============================================================
create table if not exists clase_fases (
  id            uuid primary key default uuid_generate_v4(),
  clase_id      uuid references clases(id) on delete cascade,
  orden         int not null default 1,
  nombre        text not null,
  tipo          text not null default 'Libre',
  duracion_min  int not null default 10,
  series        int not null default 0,
  descripcion   text,
  created_at    timestamptz default now()
);

-- ============================================================
-- 4. TABLA: clase_progreso
--    Estado de cada atleta en cada fase de la clase.
--    Se actualiza en tiempo real durante la clase.
-- ============================================================
create table if not exists clase_progreso (
  id             uuid primary key default uuid_generate_v4(),
  clase_id       uuid references clases(id) on delete cascade,
  fase_id        uuid references clase_fases(id) on delete cascade,
  atleta_id      uuid references atletas(id) on delete cascade,
  -- Para fases con series: array de booleanos [true, false, true, ...]
  series_completadas  boolean[] default '{}',
  -- Para fases sin series: si completó o no la fase
  fase_completada     boolean default false,
  -- Notas del instructor sobre este atleta en esta fase
  nota_instructor text,
  -- Timestamp de cada actualización para sincronización en tiempo real
  updated_at     timestamptz default now(),
  unique (clase_id, fase_id, atleta_id)
);

-- ============================================================
-- 5. TABLA: clase_estado_timer
--    Estado global del temporizador de la clase.
--    Permite que todos los dispositivos estén sincronizados.
-- ============================================================
create table if not exists clase_estado_timer (
  clase_id       uuid primary key references clases(id) on delete cascade,
  fase_actual    int not null default 0,
  timer_inicio   timestamptz,         -- cuándo se inició el timer actual
  timer_pausado  boolean default true,
  segundos_restantes int,             -- para reanudar desde donde estaba
  updated_at     timestamptz default now()
);

-- ============================================================
-- 6. MODIFICAR tabla sesiones
--    Agregar clase_id y tipo_registro para vincular sesiones
--    que vienen de una clase en vivo
-- ============================================================
alter table sesiones
  add column if not exists clase_id       uuid references clases(id),
  add column if not exists tipo_registro  text default 'individual'
                                          check (tipo_registro in ('individual','clase'));

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================
alter table clases              enable row level security;
alter table clase_atletas       enable row level security;
alter table clase_fases         enable row level security;
alter table clase_progreso      enable row level security;
alter table clase_estado_timer  enable row level security;

create policy "Autenticados pueden ver clases"
  on clases for all using (auth.role() = 'authenticated');

create policy "Autenticados pueden ver clase_atletas"
  on clase_atletas for all using (auth.role() = 'authenticated');

create policy "Autenticados pueden ver clase_fases"
  on clase_fases for all using (auth.role() = 'authenticated');

create policy "Autenticados pueden ver clase_progreso"
  on clase_progreso for all using (auth.role() = 'authenticated');

create policy "Autenticados pueden ver clase_estado_timer"
  on clase_estado_timer for all using (auth.role() = 'authenticated');

-- ============================================================
-- 8. REALTIME — habilitar para sincronización en tiempo real
--    Esto permite que cuando el instructor actualice el progreso
--    todos los atletas lo vean al instante sin recargar
-- ============================================================
-- Ejecuta esto en Supabase > Database > Replication
-- O copia y pega en SQL Editor:

alter publication supabase_realtime
  add table clase_progreso,
           clase_estado_timer,
           clases;

-- ============================================================
-- 9. FUNCIÓN: registrar_progreso_fase
--    Upsert atómico para actualizar el progreso de un atleta
--    en una fase sin condiciones de carrera
-- ============================================================
create or replace function registrar_progreso_fase(
  p_clase_id    uuid,
  p_fase_id     uuid,
  p_atleta_id   uuid,
  p_series      boolean[],
  p_completada  boolean
)
returns void language plpgsql as $$
begin
  insert into clase_progreso (clase_id, fase_id, atleta_id, series_completadas, fase_completada, updated_at)
  values (p_clase_id, p_fase_id, p_atleta_id, p_series, p_completada, now())
  on conflict (clase_id, fase_id, atleta_id)
  do update set
    series_completadas = excluded.series_completadas,
    fase_completada    = excluded.fase_completada,
    updated_at         = now();
end;
$$;

-- ============================================================
-- 10. FUNCIÓN: sincronizar_timer
--     Actualiza el estado del temporizador de la clase
-- ============================================================
create or replace function sincronizar_timer(
  p_clase_id      uuid,
  p_fase_actual   int,
  p_segundos      int,
  p_activo        boolean
)
returns void language plpgsql as $$
begin
  insert into clase_estado_timer (clase_id, fase_actual, timer_inicio, timer_pausado, segundos_restantes, updated_at)
  values (
    p_clase_id,
    p_fase_actual,
    case when p_activo then now() else null end,
    not p_activo,
    p_segundos,
    now()
  )
  on conflict (clase_id)
  do update set
    fase_actual        = excluded.fase_actual,
    timer_inicio       = excluded.timer_inicio,
    timer_pausado      = excluded.timer_pausado,
    segundos_restantes = excluded.segundos_restantes,
    updated_at         = now();
end;
$$;

-- ============================================================
-- 11. FUNCIÓN: finalizar_clase
--     Marca la clase como completada y genera las sesiones
--     resumen para el historial de progreso de cada atleta
-- ============================================================
create or replace function finalizar_clase(p_clase_id uuid)
returns void language plpgsql as $$
declare
  v_clase     record;
  v_atleta    record;
  v_fases     int;
  v_completadas int;
begin
  -- Marcar clase como completada
  update clases set estado = 'completada', updated_at = now()
  where id = p_clase_id;

  -- Obtener datos de la clase
  select * into v_clase from clases where id = p_clase_id;
  select count(*) into v_fases from clase_fases where clase_id = p_clase_id;

  -- Para cada atleta registrado, crear una sesión resumen
  for v_atleta in
    select ca.atleta_id, a.cc, a.nombre
    from clase_atletas ca
    join atletas a on a.id = ca.atleta_id
    where ca.clase_id = p_clase_id
  loop
    -- Contar fases completadas por este atleta
    select count(*) into v_completadas
    from clase_progreso
    where clase_id = p_clase_id
      and atleta_id = v_atleta.atleta_id
      and (fase_completada = true or array_length(series_completadas,1) > 0);

    -- Crear sesión resumen en el historial
    insert into sesiones (
      atleta_id, clase_id, fecha,
      rondas, notas, tipo_registro, escala
    ) values (
      v_atleta.atleta_id,
      p_clase_id,
      v_clase.fecha,
      v_completadas,
      'Clase: ' || v_clase.nombre || ' · ' || v_completadas || '/' || v_fases || ' fases completadas',
      'clase',
      'rx'
    );
  end loop;
end;
$$;

-- ============================================================
-- 12. TRIGGER: actualizar updated_at en clases y progreso
-- ============================================================
create trigger clases_updated_at
  before update on clases
  for each row execute function set_updated_at();

create trigger clase_progreso_updated_at
  before update on clase_progreso
  for each row execute function set_updated_at();
