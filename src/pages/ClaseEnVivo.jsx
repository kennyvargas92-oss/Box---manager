// src/pages/ClaseEnVivo.jsx
// Módulo de Clase en Vivo — instructor y atletas sincronizados en tiempo real
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  useClases, useAtletas,
  crearClase, actualizarProgresoFase,
  actualizarTimer, finalizarClase as finalizarClaseDB,
  suscribirseProgresoClase
} from '../hooks/useData'
import { supabase } from '../lib/supabase'

// ── Formatea segundos a MM:SS ──────────────────────────────
function fmtTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const ss = (s % 60).toString().padStart(2, '0')
  return `${m}:${ss}`
}

// ── Chip de tipo de fase ───────────────────────────────────
function FaseTipoBadge({ tipo }) {
  const colores = {
    'Movilidad': 'badge-blue',
    'Cardio':    'badge-yellow',
    'Técnica':   'badge-gray',
    'Fuerza':    'badge-accent',
    'AMRAP':     'badge-accent',
    'For Time':  'badge-accent',
    'EMOM':      'badge-blue',
    'Tabata':    'badge-yellow',
  }
  return <span className={`badge ${colores[tipo] || 'badge-gray'}`}>{tipo}</span>
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function ClaseEnVivo() {
  const { perfil } = useAuth()
  const { data: clases, loading: loadingClases, refetch } = useClases()
  const { data: atletas } = useAtletas()
  const [vistaActual, setVistaActual]   = useState('lista')  // 'lista' | 'crear' | 'control'
  const [claseActiva, setClaseActiva]   = useState(null)
  const [creando, setCreando]           = useState(false)

  const claseEnCurso = clases?.find(c => c.estado === 'activa')

  if (loadingClases) return <div className="empty-state"><div className="spinner" /></div>

  if (vistaActual === 'control' && claseActiva)
    return <ControlClase clase={claseActiva} atletas={atletas||[]}
             onFinalizar={() => { setVistaActual('lista'); setClaseActiva(null); refetch() }} />

  if (vistaActual === 'crear')
    return <CrearClase atletas={atletas||[]} perfil={perfil}
             onCancelar={() => setVistaActual('lista')}
             onCreada={(c) => { setClaseActiva(c); setVistaActual('control'); refetch() }} />

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Clase en vivo</div>
          <div className="page-sub">Dirige la sesión en tiempo real — instructor y atletas sincronizados</div>
        </div>
        {!claseEnCurso && (
          <button className="btn btn-accent" onClick={() => setVistaActual('crear')}>
            + Nueva clase
          </button>
        )}
      </div>

      {/* Clase activa */}
      {claseEnCurso && (
        <div className="card" style={{ borderLeft: '3px solid var(--green)', marginBottom: 16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--green)' }} />
            <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, flex:1 }}>
              {claseEnCurso.nombre}
            </div>
            <span className="badge badge-green">En curso</span>
            <button className="btn btn-accent btn-sm"
              onClick={() => { setClaseActiva(claseEnCurso); setVistaActual('control') }}>
              Abrir control →
            </button>
          </div>
          <div style={{ fontSize:12, color:'var(--text2)', marginTop:8 }}>
            {claseEnCurso.clase_fases?.length || 0} fases ·{' '}
            {claseEnCurso.clase_atletas?.length || 0} atletas
          </div>
        </div>
      )}

      {/* Historial */}
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--text3)', marginBottom:12 }}>
        Clases recientes
      </div>
      {(clases?.filter(c => c.estado === 'completada') || []).map(c => (
        <ClasePasadaCard key={c.id} clase={c} />
      ))}
      {!clases?.filter(c => c.estado === 'completada').length && (
        <div className="empty-state">
          <div className="empty-state-icon">▶</div>
          <div className="empty-state-text">Sin clases completadas aún</div>
        </div>
      )}
    </div>
  )
}

// ── Tarjeta de clase pasada ────────────────────────────────
function ClasePasadaCard({ clase }) {
  return (
    <div className="card" style={{ marginBottom:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:500, marginBottom:4 }}>{clase.nombre}</div>
          <div style={{ fontSize:12, color:'var(--text2)' }}>
            {new Date(clase.fecha + 'T12:00').toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' })}
            {' · '}{clase.clase_fases?.length || 0} fases
            {' · '}{clase.clase_atletas?.length || 0} atletas
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
            {(clase.clase_fases || []).map(f => (
              <span key={f.id} className="badge badge-gray" style={{ fontSize:9 }}>{f.nombre}</span>
            ))}
          </div>
        </div>
        <span className="badge badge-gray">Completada</span>
      </div>
    </div>
  )
}

// ============================================================
// CREAR CLASE
// ============================================================
function CrearClase({ atletas, perfil, onCancelar, onCreada }) {
  const [nombre,     setNombre]    = useState(`Clase ${new Date().toLocaleDateString('es-CO')}`)
  const [fecha,      setFecha]     = useState(new Date().toISOString().split('T')[0])
  const [selAtletas, setSelAtletas] = useState([])
  const [fases, setFases] = useState([
    { nombre:'Estiramiento inicial', tipo:'Movilidad', duracion:5,  series:0, desc:'' },
    { nombre:'Calentamiento',        tipo:'Cardio',    duracion:10, series:3, desc:'' },
    { nombre:'WOD principal',        tipo:'AMRAP',     duracion:20, series:0, desc:'' },
    { nombre:'Enfriamiento',         tipo:'Movilidad', duracion:5,  series:0, desc:'' },
  ])
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState('')

  const TIPOS = ['Movilidad','Cardio','Técnica','Fuerza','AMRAP','For Time','EMOM','Tabata','Libre']

  function toggleAtleta(id) {
    setSelAtletas(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  function updateFase(i, field, val) {
    setFases(prev => prev.map((f,idx) => idx===i ? {...f, [field]:val} : f))
  }

  function addFase() {
    setFases(prev => [...prev, { nombre:'Nueva fase', tipo:'Libre', duracion:10, series:0, desc:'' }])
  }

  function removeFase(i) {
    setFases(prev => prev.filter((_,idx) => idx!==i))
  }

  async function handleCrear() {
    if (!nombre.trim())        { setError('El nombre es obligatorio'); return }
    if (!selAtletas.length)    { setError('Selecciona al menos un atleta'); return }
    if (!fases.length)         { setError('Agrega al menos una fase'); return }
    setGuardando(true); setError('')
    const { data, error } = await crearClase(nombre, fecha, selAtletas, fases, perfil?.id)
    if (error) { setError(error); setGuardando(false); return }
    onCreada(data)
  }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Nueva clase</div></div>
        <button className="btn" onClick={onCancelar}>← Volver</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Datos generales</div></div>
          <div className="form-group">
            <label>Nombre de la clase</label>
            <input type="text" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej: Clase Lunes AM" />
          </div>
          <div className="form-group">
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} />
          </div>

          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--text3)', marginBottom:10 }}>
            Atletas en la clase
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {(atletas||[]).filter(u=>u.activo).map(u => (
              <label key={u.id} style={{
                display:'flex', alignItems:'center', gap:5,
                background: selAtletas.includes(u.id) ? 'var(--accent-dim)' : 'var(--dark3)',
                border: `1px solid ${selAtletas.includes(u.id) ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius:20, padding:'5px 10px', cursor:'pointer', fontSize:12, transition:'all 0.15s'
              }}>
                <input type="checkbox" checked={selAtletas.includes(u.id)}
                  onChange={() => toggleAtleta(u.id)} style={{ display:'none' }} />
                {u.nombre.split(' ')[0]}
              </label>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Fases de la clase</div>
            <button className="btn btn-ghost btn-sm" onClick={addFase}>+ Agregar</button>
          </div>
          {fases.map((f, i) => (
            <div key={i} style={{ background:'var(--dark3)', borderRadius:'var(--radius)', padding:10, marginBottom:8 }}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 60px 60px auto', gap:6, marginBottom:6 }}>
                <input type="text" value={f.nombre} onChange={e=>updateFase(i,'nombre',e.target.value)}
                  placeholder="Nombre" style={{ fontSize:12, padding:'5px 8px', background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text)' }} />
                <select value={f.tipo} onChange={e=>updateFase(i,'tipo',e.target.value)}
                  style={{ fontSize:12, padding:'5px 8px', background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text)' }}>
                  {TIPOS.map(t=><option key={t}>{t}</option>)}
                </select>
                <input type="number" value={f.duracion} onChange={e=>updateFase(i,'duracion',parseInt(e.target.value)||1)}
                  min={1} max={90} placeholder="Min"
                  style={{ fontSize:12, padding:'5px 8px', background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text)', textAlign:'center' }} />
                <input type="number" value={f.series} onChange={e=>updateFase(i,'series',parseInt(e.target.value)||0)}
                  min={0} max={20} placeholder="Series"
                  style={{ fontSize:12, padding:'5px 8px', background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text)', textAlign:'center' }} />
                <button onClick={()=>removeFase(i)}
                  style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16, padding:'0 4px' }}>✕</button>
              </div>
              <input type="text" value={f.desc} onChange={e=>updateFase(i,'desc',e.target.value)}
                placeholder="Descripción de movimientos..."
                style={{ width:'100%', fontSize:12, padding:'5px 8px', background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text)' }} />
            </div>
          ))}
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button className="btn" onClick={onCancelar}>Cancelar</button>
        <button className="btn btn-accent" onClick={handleCrear} disabled={guardando}>
          {guardando ? 'Iniciando...' : '▶ Iniciar clase'}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// CONTROL DE CLASE (vista instructor + vista atleta simulada)
// ============================================================
function ControlClase({ clase, atletas, onFinalizar }) {
  const [faseIdx,      setFaseIdx]      = useState(0)
  const [timerSeg,     setTimerSeg]     = useState(clase.clase_fases?.[0]?.duracion_min * 60 || 600)
  const [timerActivo,  setTimerActivo]  = useState(false)
  const [progreso,     setProgreso]     = useState({})   // faseId -> { atletaId -> { series:[], completada } }
  const [atletaVista,  setAtletaVista]  = useState(clase.clase_atletas?.[0]?.atleta_id || null)
  const timerRef = useRef(null)

  const fases      = clase.clase_fases || []
  const miembros   = clase.clase_atletas || []
  const fase       = fases[faseIdx]

  // Suscripción en tiempo real
  useEffect(() => {
    const unsub = suscribirseProgresoClase(clase.id, (payload) => {
      if (payload.table === 'clase_progreso') {
        const row = payload.new
        setProgreso(prev => ({
          ...prev,
          [row.fase_id]: {
            ...(prev[row.fase_id] || {}),
            [row.atleta_id]: {
              series: row.series_completadas || [],
              completada: row.fase_completada
            }
          }
        }))
      }
    })
    return unsub
  }, [clase.id])

  // Timer
  useEffect(() => {
    if (timerActivo) {
      timerRef.current = setInterval(() => {
        setTimerSeg(s => {
          if (s <= 1) { clearInterval(timerRef.current); setTimerActivo(false); return 0 }
          return s - 1
        })
      }, 1000)
      actualizarTimer(clase.id, faseIdx, timerSeg, true)
    } else {
      clearInterval(timerRef.current)
      if (fase) actualizarTimer(clase.id, faseIdx, timerSeg, false)
    }
    return () => clearInterval(timerRef.current)
  }, [timerActivo])

  function cambiarFase(nuevoIdx) {
    clearInterval(timerRef.current)
    setTimerActivo(false)
    setFaseIdx(nuevoIdx)
    const nuevaFase = fases[nuevoIdx]
    if (nuevaFase) setTimerSeg(nuevaFase.duracion_min * 60)
  }

  async function marcarSerie(atletaId, faseId, serieIdx) {
    const prev = progreso[faseId]?.[atletaId] || { series: [], completada: false }
    const series = Array(fase.series).fill(false).map((_, i) => i < prev.series.length ? prev.series[i] : false)
    series[serieIdx] = !series[serieIdx]
    setProgreso(p => ({ ...p, [faseId]: { ...(p[faseId]||{}), [atletaId]: { ...prev, series } } }))
    await actualizarProgresoFase(clase.id, faseId, atletaId, series, false)
  }

  async function marcarFaseCompleta(atletaId, faseId) {
    const prev = progreso[faseId]?.[atletaId] || { series:[], completada:false }
    const nuevaCompletada = !prev.completada
    setProgreso(p => ({ ...p, [faseId]: { ...(p[faseId]||{}), [atletaId]: { ...prev, completada: nuevaCompletada } } }))
    await actualizarProgresoFase(clase.id, faseId, atletaId, [], nuevaCompletada)
  }

  async function handleFinalizar() {
    if (!window.confirm('¿Finalizar y guardar la clase?')) return
    clearInterval(timerRef.current)
    await finalizarClaseDB(clase.id)
    onFinalizar()
  }

  if (!fase) return <div className="empty-state"><div className="empty-state-text">Esta clase no tiene fases</div></div>

  const pctTimer = Math.round((1 - timerSeg / (fase.duracion_min * 60)) * 100)
  const timerColor = timerSeg <= 30 ? 'var(--red)' : timerActivo ? 'var(--green)' : 'var(--text)'

  return (
    <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:16, minHeight:'70vh' }}>

      {/* COLUMNA IZQUIERDA — control instructor */}
      <div>
        {/* Header */}
        <div className="card" style={{ padding:12, marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--green)' }} />
            <div style={{ fontWeight:500, fontSize:13, flex:1 }}>{clase.nombre}</div>
            <button className="btn btn-danger btn-sm" onClick={handleFinalizar}>Finalizar</button>
          </div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>
            {miembros.length} atletas · {fases.length} fases
          </div>
        </div>

        {/* Timer */}
        <div className="card" style={{ padding:16, textAlign:'center', marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--text3)', marginBottom:6 }}>
            {fase.nombre}
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:52, fontWeight:800, lineHeight:1, color:timerColor, transition:'color 0.3s' }}>
            {fmtTime(timerSeg)}
          </div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>
            {fase.duracion_min} min · <FaseTipoBadge tipo={fase.tipo} />
          </div>
          <div className="progress-track" style={{ marginTop:8, height:6 }}>
            <div className="progress-fill green" style={{ width:`${pctTimer}%` }} />
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:12 }}>
            <button className={`btn btn-sm ${timerActivo ? 'btn-warn' : 'btn-success'}`}
              onClick={() => setTimerActivo(!timerActivo)}>
              {timerActivo ? '⏸ Pausar' : '▶ Iniciar'}
            </button>
            <button className="btn btn-sm" onClick={() => { clearInterval(timerRef.current); setTimerActivo(false); setTimerSeg(fase.duracion_min*60) }}>
              ↺
            </button>
          </div>
        </div>

        {/* Fases */}
        <div className="card" style={{ padding:12 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--text3)', marginBottom:10 }}>
            Fases
          </div>
          {fases.map((f, i) => (
            <div key={f.id} style={{
              display:'flex', alignItems:'center', gap:8, padding:'7px 8px',
              borderRadius:'var(--radius)', marginBottom:4, cursor: i!==faseIdx ? 'pointer' : 'default',
              background: i===faseIdx ? 'var(--green-dim)' : 'transparent'
            }} onClick={() => i!==faseIdx && cambiarFase(i)}>
              <div style={{ width:8, height:8, borderRadius:'50%', background: i<faseIdx?'var(--border2)':i===faseIdx?'var(--green)':'var(--border)' }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight: i===faseIdx?600:400, color: i===faseIdx?'var(--green)':i<faseIdx?'var(--text3)':'var(--text)' }}>
                  {f.nombre}
                </div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>
                  {f.duracion_min}min{f.series>0?` · ${f.series} series`:''}
                </div>
              </div>
            </div>
          ))}
          <div style={{ display:'flex', gap:8, marginTop:10 }}>
            {faseIdx > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => cambiarFase(faseIdx-1)}>← Ant.</button>
            )}
            {faseIdx < fases.length-1 ? (
              <button className="btn btn-accent btn-sm" style={{ flex:1 }} onClick={() => cambiarFase(faseIdx+1)}>
                Siguiente →
              </button>
            ) : (
              <button className="btn btn-success btn-sm" style={{ flex:1 }} onClick={handleFinalizar}>
                ✓ Finalizar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* COLUMNA DERECHA — progreso atletas + celular */}
      <div>
        {/* Descripción fase activa */}
        <div className="card" style={{ padding:14, marginBottom:12, borderLeft:'3px solid var(--accent)' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, marginBottom:4 }}>{fase.nombre}</div>
          <div style={{ fontSize:13, color:'var(--text2)', whiteSpace:'pre-line' }}>{fase.descripcion || 'Sin descripción'}</div>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            {fase.series > 0 && <span className="badge badge-accent">{fase.series} series</span>}
            <FaseTipoBadge tipo={fase.tipo} />
          </div>
        </div>

        {/* Progreso atletas tiempo real */}
        <div className="card" style={{ padding:14, marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--text3)', marginBottom:10 }}>
            Progreso en tiempo real
          </div>
          {miembros.map(m => {
            const atleta = atletas.find(a => a.id === m.atleta_id) ||
                           { nombre: 'Atleta', id: m.atleta_id }
            const p = progreso[fase.id]?.[m.atleta_id] || { series:[], completada:false }
            const seriesHechas = (p.series||[]).filter(Boolean).length
            const initials = atleta.nombre.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()

            return (
              <div key={m.atleta_id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <div className="avatar" style={{ width:32, height:32, fontSize:11 }}>{initials}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{atleta.nombre}</div>
                  {fase.series > 0 ? (
                    <div style={{ display:'flex', gap:3, marginTop:4 }}>
                      {Array(fase.series).fill(0).map((_, si) => (
                        <div key={si} style={{ width:14, height:14, borderRadius:3, background:(p.series||[])[si]?'var(--green)':'var(--border2)', cursor:'pointer' }}
                          onClick={() => marcarSerie(m.atleta_id, fase.id, si)} />
                      ))}
                    </div>
                  ) : (
                    <div className="progress-track" style={{ marginTop:4 }}>
                      <div className="progress-fill green" style={{ width: p.completada?'100%':'0%' }} />
                    </div>
                  )}
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  {fase.series > 0
                    ? <div style={{ fontSize:12, fontWeight:500 }}>{seriesHechas}/{fase.series}</div>
                    : p.completada
                      ? <span className="badge badge-green" style={{ fontSize:9 }}>✓</span>
                      : <span className="badge badge-gray" style={{ fontSize:9 }}>En progreso</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Vista celular del atleta */}
        <div style={{ background:'var(--dark3)', borderRadius:'var(--radius-lg)', padding:12, border:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--text3)', flex:1 }}>
              Vista celular
            </div>
            <select value={atletaVista||''} onChange={e=>setAtletaVista(e.target.value)}
              style={{ fontSize:11, padding:'3px 6px', background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:4, color:'var(--text)' }}>
              {miembros.map(m => {
                const a = atletas.find(x=>x.id===m.atleta_id)
                return a ? <option key={m.atleta_id} value={m.atleta_id}>{a.nombre.split(' ')[0]}</option> : null
              })}
            </select>
          </div>

          {atletaVista && (
            <VistaCelular
              fase={fase} timerSeg={timerSeg}
              atletaId={atletaVista}
              progreso={progreso[fase.id]?.[atletaVista] || { series:[], completada:false }}
              onMarcarSerie={(si) => marcarSerie(atletaVista, fase.id, si)}
              onMarcarCompleta={() => marcarFaseCompleta(atletaVista, fase.id)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Vista del celular del atleta ───────────────────────────
function VistaCelular({ fase, timerSeg, atletaId, progreso, onMarcarSerie, onMarcarCompleta }) {
  const seriesAtleta = progreso.series || []
  const completada   = progreso.completada

  return (
    <div style={{ background:'var(--dark2)', borderRadius:12, padding:14, border:'1px solid var(--border)', maxWidth:280 }}>
      {/* Header cel */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontSize:12, fontWeight:500 }}>Mi clase</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:timerSeg<=30?'var(--red)':'var(--green)' }}>
          {fmtTime(timerSeg)}
        </div>
      </div>

      {/* Fase activa */}
      <div style={{ background:'var(--accent-dim)', border:'1px solid rgba(232,67,10,0.2)', borderRadius:8, padding:10, marginBottom:10 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--accent)', marginBottom:3 }}>{fase.nombre}</div>
        <div style={{ fontSize:11, color:'var(--text2)', marginBottom:6 }}>{fase.descripcion || ''}</div>
        <FaseTipoBadge tipo={fase.tipo} />
        {fase.series > 0 && <span className="badge badge-gray" style={{ marginLeft:4, fontSize:9 }}>{fase.series} series</span>}
      </div>

      {/* Series o botón completa */}
      {fase.series > 0 ? (
        <>
          <div style={{ fontSize:10, color:'var(--text3)', marginBottom:6 }}>Toca al completar cada serie</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:8 }}>
            {Array(fase.series).fill(0).map((_,i) => {
              const done = seriesAtleta[i] === true
              return (
                <div key={i} onClick={() => onMarcarSerie(i)} style={{
                  border: `1px solid ${done?'var(--green)':'var(--border)'}`,
                  borderRadius:8, padding:'10px 6px', textAlign:'center', cursor:'pointer',
                  background: done ? 'var(--green-dim)' : 'var(--dark3)', transition:'all 0.15s'
                }}>
                  <div style={{ fontSize:18, color:done?'var(--green)':'var(--text3)' }}>{done?'✓':'○'}</div>
                  <div style={{ fontSize:10, color:done?'var(--green)':'var(--text3)' }}>Serie {i+1}</div>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize:11, color:'var(--text2)', textAlign:'center' }}>
            {seriesAtleta.filter(Boolean).length} de {fase.series} completadas
          </div>
        </>
      ) : (
        <button onClick={onMarcarCompleta} style={{
          width:'100%', padding:12, background:completada?'var(--green-dim)':'transparent',
          border:`1px solid ${completada?'var(--green)':'var(--border2)'}`,
          borderRadius:8, color:completada?'var(--green)':'var(--text)',
          fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s'
        }}>
          {completada ? '✓ Fase completada' : 'Marcar como completada'}
        </button>
      )}
    </div>
  )
}
