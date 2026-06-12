// src/pages/Acceso.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAccesosHoy } from '../hooks/useData'
import { useAuth } from '../context/AuthContext'

export default function Acceso() {
  const { perfil } = useAuth()
  const { data: accesosHoy, loading, refetch } = useAccesosHoy()
  const [cc,       setCc]       = useState('')
  const [resultado, setResultado] = useState(null)
  const [procesando, setProcesando] = useState(false)

  async function registrarEntrada() {
    if (!cc.trim()) { setResultado({ tipo: 'error', nombre: 'Sin cédula', detalle: 'Ingresa el número de cédula' }); return }
    setProcesando(true)

    // Buscar atleta por CC
    const { data: atleta, error } = await supabase
      .from('atletas')
      .select('*, planes(*)')
      .eq('cc', cc.trim())
      .single()

    if (error || !atleta) {
      setResultado({ tipo: 'error', nombre: '⊘ No encontrado', detalle: `La cédula ${cc} no está registrada` })
      setProcesando(false)
      return
    }

    // Calcular estado de pago
    const { data: pagos } = await supabase
      .from('pagos')
      .select('fecha_vence, estado')
      .eq('atleta_id', atleta.id)
      .order('fecha_vence', { ascending: false })
      .limit(1)

    const ultimoPago = pagos?.[0]
    const diasVence = ultimoPago
      ? Math.ceil((new Date(ultimoPago.fecha_vence) - new Date()) / (1000 * 60 * 60 * 24))
      : null

    // Contar visitas del mes
    const inicioMes = new Date()
    inicioMes.setDate(1)
    const { count: visitasMes } = await supabase
      .from('accesos')
      .select('*', { count: 'exact', head: true })
      .eq('atleta_id', atleta.id)
      .gte('fecha', inicioMes.toISOString().split('T')[0])

    // Registrar acceso
    const ahora = new Date()
    await supabase.from('accesos').insert({
      atleta_id: atleta.id,
      cc: atleta.cc,
      nombre: atleta.nombre,
      fecha: ahora.toISOString().split('T')[0],
      hora: ahora.toTimeString().slice(0, 8),
      registrado_por: perfil?.id
    })

    // Determinar tipo de resultado por estado de pago
    let tipo = 'ok'
    let mensajePago = `Mensualidad al día · ${diasVence} días restantes`
    if (diasVence === null) { tipo = 'vencido'; mensajePago = 'Sin pago registrado' }
    else if (diasVence < 0) { tipo = 'blocked'; mensajePago = `Pago vencido hace ${Math.abs(diasVence)} días` }
    else if (diasVence === 0) { tipo = 'warning'; mensajePago = 'El pago vence hoy' }
    else if (diasVence <= 3) { tipo = 'warning'; mensajePago = `Vence en ${diasVence} día${diasVence>1?'s':''}` }
    else if (diasVence <= 7) { tipo = 'pronto'; mensajePago = `Vence en ${diasVence} días` }

    const hora = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    setResultado({
      tipo,
      nombre: `${tipo==='ok'||tipo==='pronto'?'✓':tipo==='warning'?'⚠':'✕'} ${atleta.nombre}`,
      detalle: `${hora} · ${visitasMes||1} visitas este mes`,
      pago: mensajePago
    })

    refetch()
    setProcesando(false)

    // Limpiar después de 3 segundos
    setTimeout(() => { setCc(''); setResultado(null) }, 3500)
  }

  const hoy = accesosHoy || []
  const unicosHoy = new Set(hoy.map(a => a.cc)).size

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Control de acceso</div>
          <div className="page-sub">Registra el ingreso de atletas por cédula</div>
        </div>
      </div>

      {/* Métricas */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="metric-card">
          <div className="metric-label">Ingresos hoy</div>
          <div className="metric-value">{hoy.length}</div>
          <div className="metric-sub">registros</div>
        </div>
        <div className="metric-card green">
          <div className="metric-label">Atletas distintos</div>
          <div className="metric-value">{unicosHoy}</div>
        </div>
        <div className="metric-card blue">
          <div className="metric-label">Último ingreso</div>
          <div className="metric-value" style={{ fontSize: '18px' }}>
            {hoy[0]?.hora?.slice(0, 5) || '—'}
          </div>
        </div>
      </div>

      {/* Input CC */}
      <div className="card">
        <div className="card-header"><div className="card-title">Registrar ingreso</div></div>
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Digita la cédula del atleta
          </p>
          <input
            type="number"
            className="big-cc-input"
            placeholder="0000000000"
            value={cc}
            onChange={e => setCc(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !procesando && registrarEntrada()}
            maxLength={12}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '14px' }}>
            <button className="btn btn-accent" style={{ padding: '11px 32px', fontSize: '15px' }}
              onClick={registrarEntrada} disabled={procesando}>
              {procesando ? 'Verificando...' : '◉  Registrar entrada'}
            </button>
            <button className="btn" onClick={() => { setCc(''); setResultado(null) }}>Limpiar</button>
          </div>
          {resultado && (
            <div className={`access-result ${resultado.tipo}`} style={{ display: 'block' }}>
              <div className="access-result-name">{resultado.nombre}</div>
              <div className="access-result-detail">{resultado.detalle}</div>
              {resultado.pago && (
                <div className="access-result-alert"
                  style={{
                    background: resultado.tipo==='ok' ? 'rgba(34,197,94,0.15)' :
                                resultado.tipo==='pronto' ? 'rgba(245,158,11,0.15)' :
                                resultado.tipo==='warning' ? 'rgba(249,115,22,0.15)' : 'rgba(239,68,68,0.15)',
                    color: resultado.tipo==='ok' ? 'var(--green)' :
                           resultado.tipo==='pronto' ? 'var(--yellow)' :
                           resultado.tipo==='warning' ? '#f97316' : 'var(--red)'
                  }}>
                  {resultado.pago}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Log del día */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Registro del día</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        {loading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : hoy.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◉</div>
            <div className="empty-state-text">Sin ingresos registrados hoy</div>
          </div>
        ) : (
          hoy.map(a => (
            <div key={a.id} className="log-item">
              <div className="log-time">{a.hora?.slice(0,5)}</div>
              <div className="avatar" style={{ width:32, height:32, fontSize:11 }}>
                {a.nombre?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div className="log-name">{a.nombre}</div>
                <div className="log-cc">CC {a.cc}</div>
              </div>
              <span className="badge badge-green">✓</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
