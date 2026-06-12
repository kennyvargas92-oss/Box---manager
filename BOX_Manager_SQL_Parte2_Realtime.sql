-- ============================================================
-- BOX MANAGER — SQL PARTE 2 de 2
-- Activar sincronización en tiempo real (Clase en vivo)
-- Pega esto en Supabase > SQL Editor > New Query > RUN
-- DESPUÉS de haber ejecutado la Parte 1
-- ============================================================
-- NOTA: Supabase mostrará una advertencia de confirmación
-- al ejecutar este código. Eso es normal — solo haz clic
-- en "Confirm" o "I understand" para continuar.
-- ============================================================

alter publication supabase_realtime
  add table clase_progreso,
           clase_estado_timer,
           clases;
