// src/hooks/useData.js
// Hooks de datos — cada función devuelve { data, error, loading }
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ---- HOOK GENÉRICO ----
function useQuery(queryFn, deps = []) {
  const [data,    setData]    = useState(null)
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(true)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await queryFn()
      if (result.error) throw result.error
      setData(result.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => { execute() }, [execute])
  return { data, error, loading, refetch: execute }
}

// ============================================================
// ATLETAS
// ============================================================
export function useAtletas() {
  return useQuery(() =>
    supabase.from('atletas').select('*, planes(nombre,precio)').order('nombre')
  )
}

export function useAtletaPorCC(cc) {
  return useQuery(
    () => supabase.from('atletas').select('*, planes(*)').eq('cc', cc).single(),
    [cc]
  )
}

export async function crearAtleta(datos) {
  const { data, error } = await supabase.from('atletas').insert(datos).select().single()
  return { data, error: error?.message }
}

export async function actualizarAtleta(id, datos) {
  const { data, error } = await supabase.from('atletas').update(datos).eq('id', id).select().single()
  return { data, error: error?.message }
}

// ============================================================
// ACCESOS
// ============================================================
export function useAccesosHoy() {
  const hoy = new Date().toISOString().split('T')[0]
  return useQuery(
    () => supabase.from('accesos').select('*').eq('fecha', hoy).order('hora', { ascending: false }),
    [hoy]
  )
}

export function useAccesosMes(atletaId) {
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0]
  return useQuery(
    () => supabase.from('accesos').select('*').eq('atleta_id', atletaId).gte('fecha', inicioMes),
    [atletaId]
  )
}

export async function registrarAcceso(atletaId, cc, nombre) {
  const ahora = new Date()
  const { data, error } = await supabase.from('accesos').insert({
    atleta_id: atletaId,
    cc,
    nombre,
    fecha: ahora.toISOString().split('T')[0],
    hora: ahora.toTimeString().slice(0, 8)
  }).select().single()
  return { data, error: error?.message }
}

// ============================================================
// PAGOS
// ============================================================
export function usePagos() {
  return useQuery(() =>
    supabase.from('pagos').select('*, atletas(nombre,cc), planes(nombre)').order('created_at', { ascending: false })
  )
}

export async function registrarPago(datos) {
  const { data, error } = await supabase.from('pagos').insert(datos).select().single()
  return { data, error: error?.message }
}

// ============================================================
// PLANES Y SUSCRIPCIONES
// ============================================================
export function usePlanes() {
  return useQuery(() => supabase.from('planes').select('*').eq('activo', true).order('precio'))
}

export async function crearPlan(datos) {
  const { data, error } = await supabase.from('planes').insert(datos).select().single()
  return { data, error: error?.message }
}

export async function actualizarPlan(id, datos) {
  const { data, error } = await supabase.from('planes').update(datos).eq('id', id).select().single()
  return { data, error: error?.message }
}

// ============================================================
// RUTINAS Y SESIONES
// ============================================================
export function useRutinas() {
  return useQuery(() =>
    supabase.from('rutinas').select('*').order('fecha', { ascending: false }).limit(20)
  )
}

export function useSesionesPorRutina(rutinaId) {
  return useQuery(
    () => supabase.from('sesiones').select('*, atletas(nombre,cc,peso_actual)').eq('rutina_id', rutinaId).order('rondas', { ascending: false }),
    [rutinaId]
  )
}

export async function crearRutina(datos) {
  const { data, error } = await supabase.from('rutinas').insert(datos).select().single()
  return { data, error: error?.message }
}

export async function registrarSesion(datos) {
  const { data, error } = await supabase.from('sesiones').insert(datos).select().single()
  return { data, error: error?.message }
}

// ============================================================
// MEDICIONES / PROGRESO
// ============================================================
export function useMedicionesPorAtleta(atletaId) {
  return useQuery(
    () => supabase.from('mediciones').select('*').eq('atleta_id', atletaId).order('fecha'),
    [atletaId]
  )
}

export async function registrarMedicion(datos) {
  const { data, error } = await supabase.from('mediciones').insert(datos).select().single()
  return { data, error: error?.message }
}

// ============================================================
// TIENDA
// ============================================================
export function useProductos() {
  return useQuery(() =>
    supabase.from('productos').select('*').eq('activo', true).order('nombre')
  )
}

export function useVentas() {
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0]
  return useQuery(() =>
    supabase.from('ventas').select('*, productos(nombre,categoria), atletas(nombre)').gte('created_at', inicioMes).order('created_at', { ascending: false })
  )
}

export function useDeudores() {
  return useQuery(() =>
    supabase.from('ventas').select('*, productos(nombre), atletas(nombre,cc)').eq('es_fiado', true).eq('fiado_pagado', false).order('created_at', { ascending: false })
  )
}

export async function registrarVenta(datos) {
  // Registrar venta
  const { data: venta, error: errV } = await supabase.from('ventas').insert(datos).select().single()
  if (errV) return { error: errV.message }
  // Descontar stock
  const { error: errS } = await supabase.rpc('decrementar_stock', {
    p_producto_id: datos.producto_id,
    p_cantidad: datos.cantidad
  })
  return { data: venta, error: errS?.message }
}

export async function crearProducto(datos) {
  const { data, error } = await supabase.from('productos').insert(datos).select().single()
  return { data, error: error?.message }
}

export async function actualizarStock(productoId, nuevoStock) {
  const { data, error } = await supabase.from('productos').update({ stock: nuevoStock }).eq('id', productoId).select().single()
  return { data, error: error?.message }
}

// ============================================================
// FINANZAS
// ============================================================
export function useResumenFinanzas() {
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0]

  return useQuery(() =>
    Promise.all([
      supabase.from('pagos').select('monto').gte('fecha_pago', inicioMes).eq('estado', 'pagado'),
      supabase.from('ventas').select('total').gte('created_at', inicioMes),
      supabase.from('gastos').select('monto,categoria').gte('fecha', inicioMes)
    ]).then(([pagos, ventas, gastos]) => ({
      data: {
        ingresosMensualidades: pagos.data?.reduce((s,p) => s + Number(p.monto), 0) || 0,
        ingresosTienda: ventas.data?.reduce((s,v) => s + Number(v.total), 0) || 0,
        gastosFijos: gastos.data?.filter(g=>g.categoria==='Fijo').reduce((s,g)=>s+Number(g.monto),0) || 0,
        gastosVariables: gastos.data?.filter(g=>g.categoria==='Variable').reduce((s,g)=>s+Number(g.monto),0) || 0,
        gastos_raw: gastos.data || []
      },
      error: pagos.error || ventas.error || gastos.error
    }))
  )
}

export async function registrarGasto(datos) {
  const { data, error } = await supabase.from('gastos').insert(datos).select().single()
  return { data, error: error?.message }
}

// ============================================================
// CONFIGURACIÓN
// ============================================================
export function useConfiguracion() {
  return useQuery(() => supabase.from('configuracion_box').select('*').single())
}

export async function guardarConfiguracion(id, datos) {
  const { data, error } = await supabase.from('configuracion_box').update(datos).eq('id', id).select().single()
  return { data, error: error?.message }
}

// ============================================================
// POLÍTICAS
// ============================================================
export function usePoliticas() {
  return useQuery(() => supabase.from('politicas_box').select('*').single())
}

export async function guardarPoliticas(id, datos) {
  const { data, error } = await supabase.from('politicas_box').update(datos).eq('id', id).select().single()
  return { data, error: error?.message }
}

// ============================================================
// CLASE EN VIVO
// ============================================================

export function useClases() {
  return useQuery(() =>
    supabase.from('clases')
      .select('*, clase_fases(*), clase_atletas(atleta_id, atletas(nombre,cc))')
      .order('fecha', { ascending: false })
      .limit(20)
  )
}

export function useClaseActiva() {
  return useQuery(() =>
    supabase.from('clases')
      .select('*, clase_fases(*), clase_atletas(atleta_id, atletas(nombre,cc,peso_actual))')
      .eq('estado', 'activa')
      .single()
  )
}

export function useProgresoClase(claseId) {
  return useQuery(
    () => supabase.from('clase_progreso')
      .select('*, atletas(nombre, cc), clase_fases(nombre, orden)')
      .eq('clase_id', claseId),
    [claseId]
  )
}

export function useTimerClase(claseId) {
  return useQuery(
    () => supabase.from('clase_estado_timer')
      .select('*')
      .eq('clase_id', claseId)
      .single(),
    [claseId]
  )
}

export async function crearClase(nombre, fecha, atletaIds, fases, instructorId) {
  // 1. Crear la clase
  const { data: clase, error: errC } = await supabase
    .from('clases')
    .insert({ nombre, fecha, estado: 'pendiente', creado_por: instructorId })
    .select().single()
  if (errC) return { error: errC.message }

  // 2. Agregar atletas
  const { error: errA } = await supabase.from('clase_atletas').insert(
    atletaIds.map(id => ({ clase_id: clase.id, atleta_id: id }))
  )
  if (errA) return { error: errA.message }

  // 3. Agregar fases en orden
  const { error: errF } = await supabase.from('clase_fases').insert(
    fases.map((f, i) => ({
      clase_id:    clase.id,
      orden:       i + 1,
      nombre:      f.nombre,
      tipo:        f.tipo,
      duracion_min: f.duracion,
      series:      f.series,
      descripcion: f.desc || ''
    }))
  )
  if (errF) return { error: errF.message }

  // 4. Activar la clase
  await supabase.from('clases')
    .update({ estado: 'activa' })
    .eq('id', clase.id)

  return { data: clase }
}

export async function actualizarProgresoFase(claseId, faseId, atletaId, series, completada) {
  const { error } = await supabase.rpc('registrar_progreso_fase', {
    p_clase_id:   claseId,
    p_fase_id:    faseId,
    p_atleta_id:  atletaId,
    p_series:     series,
    p_completada: completada
  })
  return { error: error?.message }
}

export async function actualizarTimer(claseId, faseActual, segundos, activo) {
  const { error } = await supabase.rpc('sincronizar_timer', {
    p_clase_id:    claseId,
    p_fase_actual: faseActual,
    p_segundos:    segundos,
    p_activo:      activo
  })
  return { error: error?.message }
}

export async function finalizarClase(claseId) {
  const { error } = await supabase.rpc('finalizar_clase', { p_clase_id: claseId })
  return { error: error?.message }
}

// Suscripción en tiempo real al progreso de una clase
// Uso: const unsub = suscribirseProgresoClase(claseId, (payload) => { ... })
//      unsub() // para desuscribirse
export function suscribirseProgresoClase(claseId, onCambio) {
  const channel = supabase
    .channel(`clase_${claseId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'clase_progreso',
      filter: `clase_id=eq.${claseId}`
    }, onCambio)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'clase_estado_timer',
      filter: `clase_id=eq.${claseId}`
    }, onCambio)
    .subscribe()

  return () => supabase.removeChannel(channel)
}
