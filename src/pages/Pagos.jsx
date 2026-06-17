// src/pages/Pagos.jsx — Módulo de Mensualidades
import { useState } from 'react'
import { usePagos, useAtletas, usePlanes, registrarPago } from '../hooks/useData'
import { useAuth } from '../context/AuthContext'

// ── Calcula días restantes desde hoy hasta fecha_vence ──
function diasRestantes(fechaVence) {
  if (!fechaVence) return null
  const hoy   = new Date(); hoy.setHours(0,0,0,0)
  const vence = new Date(fechaVence + 'T12:00')
  return Math.round((vence - hoy) / (1000 * 60 * 60 * 24))
}

// ── Semáforo: color según días restantes ──
function semaforo(dias) {
  if (dias === null) return { color: 'var(--text3)', label: 'Sin pago', badge: 'badge-gray' }
  if (dias < 0)     return { color: 'var(--red)',   label: `Vencido hace ${Math.abs(dias)}d`, badge: 'badge-red' }
  if (dias <= 5)    return { color: '#f59e0b',       label: `Vence en ${dias}d`, badge: 'badge-yellow' }
  return              { color: 'var(--green)',  label: `Al día (${dias}d)`, badge: 'badge-green' }
}

// ── Excluir domingos para calcular fecha de vencimiento ──
function calcularVencimiento(fechaInicio, diasPlan) {
  const fecha = new Date(fechaInicio + 'T12:00')
  let diasContados = 0
  while (diasContados < diasPlan) {
    fecha.setDate(fecha.getDate() + 1)
    if (fecha.getDay() !== 0) diasContados++ // 0 = domingo
  }
  return fecha.toISOString().split('T')[0]
}

export default function Pagos() {
  const { data: pagos,   loading: loadingPagos,   refetch } = usePagos()
  const { data: atletas, loading: loadingAtletas }          = useAtletas()
  const { data: planes }                                     = usePlanes()
  const { perfil }                                           = useAuth()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [filtro,       setFiltro]       = useState('todos') // todos | al_dia | por_vencer | vencidos
  const [busqueda,     setBusqueda]     = useState('')

  // Construir mapa atleta -> último pago
  const ultimoPagoPorAtleta = {}
  ;(pagos || []).forEach(p => {
    if (!p.atleta_id) return
    const prev = ultimoPagoPorAtleta[p.atleta_id]
    if (!prev || new Date(p.fecha_vence) > new Date(prev.fecha_vence)) {
      ultimoPagoPorAtleta[p.atleta_id] = p
    }
  })

  // Lista de atletas con su estado de pago
  const atletasConEstado = (atletas || [])
    .filter(a => a.activo)
    .map(a => {
      const pago = ultimoPagoPorAtleta[a.id] || null
      const dias = pago ? diasRestantes(pago.fecha_vence) : null
      const sem  = semaforo(dias)
      return { ...a, ultimoPago: pago, dias, sem }
    })
    .filter(a => {
      if (filtro === 'al_dia')     return a.dias !== null && a.dias > 5
      if (filtro === 'por_vencer') return a.dias !== null && a.dias >= 0 && a.dias <= 5
      if (filtro === 'vencidos')   return a.dias !== null && a.dias < 0 || a.dias === null
      return true
    })
    .filter(a => {
      if (!busqueda.trim()) return true
      const q = busqueda.toLowerCase()
      return a.nombre.toLowerCase().includes(q) || a.cc.includes(q)
    })

  const conteo = {
    alDia:     atletasConEstado.filter(a => a.dias !== null && a.dias > 5).length,
    porVencer: atletasConEstado.filter(a => a.dias !== null && a.dias >= 0 && a.dias <= 5).length,
    vencidos:  atletasConEstado.filter(a => a.dias === null || a.dias < 0).length,
  }

  if (loadingPagos || loadingAtletas)
    return <div className="empty-state"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Mensualidades</div>
          <div className="page-sub">{atletas?.filter(a=>a.activo).length || 0} atletas activos</div>
        </div>
        <button className="btn btn-accent" onClick={() => setModalAbierto(true)}>+ Registrar pago</button>
      </div>

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ borderLeft: '3px solid var(--green)', cursor: 'pointer' }} onClick={() => setFiltro('al_dia')}>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>{conteo.alDia}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>Al día</div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid #f59e0b', cursor: 'pointer' }} onClick={() => setFiltro('por_vencer')}>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#f59e0b' }}>{conteo.porVencer}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>Por vencer (≤5 días)</div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid var(--red)', cursor: 'pointer' }} onClick={() => setFiltro('vencidos')}>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--red)' }}>{conteo.vencidos}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>Vencidos / Sin pago</div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por nombre o cédula..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: 200, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '9px 14px', color: 'var(--text)', fontSize: 13 }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {[['todos','Todos'],['al_dia','Al día'],['por_vencer','Por vencer'],['vencidos','Vencidos']].map(([val, lbl]) => (
            <button key={val}
              className={`btn btn-sm ${filtro === val ? 'btn-accent' : ''}`}
              onClick={() => setFiltro(val)}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de atletas con estado */}
      {atletasConEstado.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◎</div>
          <div className="empty-state-text">Sin atletas en esta categoría</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Atleta</th>
                  <th>Plan</th>
                  <th>Último pago</th>
                  <th>Vence</th>
                  <th>Estado</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {atletasConEstado.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{a.nombre}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>{a.cc}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{a.planes?.nombre || '—'}</td>
                    <td style={{ fontSize: 12 }}>
                      {a.ultimoPago
                        ? new Date(a.ultimoPago.fecha_pago + 'T12:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {a.ultimoPago
                        ? new Date(a.ultimoPago.fecha_vence + 'T12:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td>
                      <span className={`badge ${a.sem.badge}`}>{a.sem.label}</span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {a.ultimoPago
                        ? `$${Number(a.ultimoPago.monto).toLocaleString('es-CO')}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historial de pagos */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 12 }}>
          Historial de pagos recientes
        </div>
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Atleta</th>
                  <th>Plan</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Fecha pago</th>
                  <th>Vence</th>
                </tr>
              </thead>
              <tbody>
                {(pagos || []).slice(0, 20).map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.atletas?.nombre || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>{p.atletas?.cc}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{p.planes?.nombre || '—'}</td>
                    <td style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>${Number(p.monto).toLocaleString('es-CO')}</td>
                    <td style={{ fontSize: 12 }}>{p.metodo}</td>
                    <td style={{ fontSize: 12 }}>{p.fecha_pago ? new Date(p.fecha_pago + 'T12:00').toLocaleDateString('es-CO') : '—'}</td>
                    <td style={{ fontSize: 12 }}>{p.fecha_vence ? new Date(p.fecha_vence + 'T12:00').toLocaleDateString('es-CO') : '—'}</td>
                  </tr>
                ))}
                {(!pagos || pagos.length === 0) && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>Sin pagos registrados aún</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalAbierto && (
        <ModalPago
          atletas={atletas || []}
          planes={planes || []}
          perfil={perfil}
          onClose={() => setModalAbierto(false)}
          onSaved={() => { setModalAbierto(false); refetch() }}
        />
      )}
    </div>
  )
}

// ============================================================
// MODAL REGISTRAR PAGO
// ============================================================
function ModalPago({ atletas, planes, perfil, onClose, onSaved }) {
  const [atletaId,  setAtletaId]  = useState('')
  const [planId,    setPlanId]    = useState('')
  const [monto,     setMonto]     = useState('')
  const [metodo,    setMetodo]    = useState('Efectivo')
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0])
  const [error,     setError]     = useState('')
  const [guardando, setGuardando] = useState(false)

  // Cuando cambia el atleta, autocompletar plan y monto
  function handleAtleta(id) {
    setAtletaId(id)
    const atleta = atletas.find(a => a.id === id)
    if (atleta?.plan_id) {
      setPlanId(atleta.plan_id)
      const plan = planes.find(p => p.id === atleta.plan_id)
      if (plan) setMonto(String(plan.precio))
    }
  }

  // Cuando cambia el plan, actualizar monto
  function handlePlan(id) {
    setPlanId(id)
    const plan = planes.find(p => p.id === id)
    if (plan) setMonto(String(plan.precio))
  }

  async function handleGuardar() {
    if (!atletaId)    { setError('Selecciona un atleta'); return }
    if (!planId)      { setError('Selecciona un plan'); return }
    if (!monto)       { setError('El monto es obligatorio'); return }
    if (!fechaPago)   { setError('La fecha es obligatoria'); return }

    setGuardando(true); setError('')

    const plan        = planes.find(p => p.id === planId)
    const fechaVence  = calcularVencimiento(fechaPago, plan?.duracion_dias || 30)

    const { error } = await registrarPago({
      atleta_id:     atletaId,
      plan_id:       planId,
      monto:         Number(monto),
      fecha_pago:    fechaPago,
      fecha_vence:   fechaVence,
      metodo,
      estado:        'pagado',
      registrado_por: perfil?.id || null,
    })

    if (error) { setError(error); setGuardando(false); return }
    onSaved()
  }

  const planSeleccionado = planes.find(p => p.id === planId)

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Registrar pago</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Atleta *</label>
            <select value={atletaId} onChange={e => handleAtleta(e.target.value)}>
              <option value="">— Seleccionar atleta —</option>
              {atletas.filter(a => a.activo).map(a => (
                <option key={a.id} value={a.id}>{a.nombre} — {a.cc}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Plan *</label>
            <select value={planId} onChange={e => handlePlan(e.target.value)}>
              <option value="">— Seleccionar plan —</option>
              {planes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} — ${Number(p.precio).toLocaleString('es-CO')} / {p.duracion_dias} días</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Monto cobrado *</label>
              <input type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="$" min="0" />
            </div>
            <div className="form-group">
              <label>Método de pago</label>
              <select value={metodo} onChange={e => setMetodo(e.target.value)}>
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Nequi</option>
                <option>Daviplata</option>
                <option>Otro</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Fecha de pago *</label>
            <input type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)} />
          </div>

          {planSeleccionado && fechaPago && (
            <div style={{ background: 'var(--dark3)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
              Vence el <strong style={{ color: 'var(--text)' }}>
                {new Date(calcularVencimiento(fechaPago, planSeleccionado.duracion_dias) + 'T12:00')
                  .toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </strong> (excluyendo domingos)
            </div>
          )}

          {error && <div className="alert-error" style={{ marginTop: 12 }}>{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleGuardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Registrar pago'}
          </button>
        </div>
      </div>
    </div>
  )
}
