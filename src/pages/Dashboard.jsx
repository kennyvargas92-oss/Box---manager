// src/pages/Dashboard.jsx
import { useAuth } from '../context/AuthContext'
import { useResumenFinanzas, useAtletas } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'

export default function Dashboard() {
  const { perfil } = useAuth()
  const { data: finanzas } = useResumenFinanzas()
  const { data: atletas } = useAtletas()
  const [accesosHoy, setAccesosHoy] = useState(0)
  const [alertas, setAlertas] = useState([])

  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0]
    supabase.from('accesos').select('*', { count: 'exact', head: true }).eq('fecha', hoy)
      .then(({ count }) => setAccesosHoy(count || 0))

    // Atletas con pago por vencer en 7 días
    const en7dias = new Date(); en7dias.setDate(en7dias.getDate() + 7)
    supabase.from('pagos').select('atletas(nombre, cc), fecha_vence').lte('fecha_vence', en7dias.toISOString().split('T')[0]).eq('estado','pagado')
      .then(({ data }) => setAlertas(data || []))
  }, [])

  const totalIngresos = finanzas ? finanzas.ingresosMensualidades + finanzas.ingresosTienda : 0
  const totalGastos = finanzas ? finanzas.gastosFijos + finanzas.gastosVariables : 0
  const utilidad = totalIngresos - totalGastos
  const activos = atletas?.filter(u => u.activo).length || 0

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Bienvenido, {perfil?.nombre} · {new Date().toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})}</div>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card accent">
          <div className="metric-label">Ingresos hoy</div>
          <div className="metric-value">{accesosHoy}</div>
          <div className="metric-sub">atletas registrados</div>
        </div>
        <div className="metric-card green">
          <div className="metric-label">Atletas activos</div>
          <div className="metric-value">{activos}</div>
          <div className="metric-sub">de {atletas?.length || 0} total</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Alertas de pago</div>
          <div className="metric-value" style={{ color: alertas.length > 0 ? 'var(--yellow)' : 'var(--text)' }}>{alertas.length}</div>
          <div className="metric-sub">próximos 7 días</div>
        </div>
      </div>

      {perfil?.rol === 'dueño' && (
        <div className="card" style={{ borderLeft: `3px solid ${utilidad >= 0 ? 'var(--green)' : 'var(--red)'}`, marginBottom: '16px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
            <div>
              <div style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'2px', textTransform:'uppercase', color:'var(--text3)', marginBottom:'6px' }}>
                Resumen financiero del mes
              </div>
              <div style={{ display:'flex', gap:'20px', flexWrap:'wrap' }}>
                <div><span style={{ fontSize:'12px', color:'var(--text2)' }}>Ingresos </span>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:'18px', fontWeight:'700', color:'var(--green)' }}>
                    ${totalIngresos.toLocaleString('es-CO')}
                  </span>
                </div>
                <div><span style={{ fontSize:'12px', color:'var(--text2)' }}>Gastos </span>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:'18px', fontWeight:'700', color:'var(--red)' }}>
                    ${totalGastos.toLocaleString('es-CO')}
                  </span>
                </div>
                <div><span style={{ fontSize:'12px', color:'var(--text2)' }}>Utilidad </span>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:'18px', fontWeight:'700', color: utilidad >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {utilidad >= 0 ? '+' : ''}{utilidad.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {alertas.length > 0 && (
        <div className="card">
          <div className="card-header"><div className="card-title">Alertas de pago</div></div>
          {alertas.slice(0,5).map((a, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <div className="avatar">{a.atletas?.nombre?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:'500' }}>{a.atletas?.nombre}</div>
                <div style={{ fontSize:'12px', color:'var(--text3)' }}>Vence: {new Date(a.fecha_vence).toLocaleDateString('es-CO')}</div>
              </div>
              <span className="badge badge-yellow">Por vencer</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- PÁGINAS STUB (se desarrollan en siguientes entregas) ----
export function Atletas()       { return <PageStub titulo="Atletas" /> }
export function Pagos()         { return <PageStub titulo="Mensualidades" /> }
export function Suscripciones() { return <PageStub titulo="Suscripciones" /> }
export function Rutinas()       { return <PageStub titulo="Rutinas / WOD" /> }
export function Progreso()      { return <PageStub titulo="Progreso atletas" /> }
export function Tienda()        { return <PageStub titulo="Tienda" /> }
export function Finanzas()      { return <PageStub titulo="Finanzas BOX" /> }
export function Metricas()      { return <PageStub titulo="Métricas" /> }
export function Configuracion() { return <PageStub titulo="Configuración del BOX" /> }
export function Politicas()     { return <PageStub titulo="Políticas y documentos" /> }

export function AccesoRestringido() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'300px', textAlign:'center', padding:'40px' }}>
      <div style={{ fontSize:'48px', color:'var(--text3)', marginBottom:'16px' }}>⊘</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:'24px', fontWeight:'800', textTransform:'uppercase', marginBottom:'8px' }}>Acceso restringido</div>
      <div style={{ fontSize:'14px', color:'var(--text2)', maxWidth:'360px' }}>Esta sección es solo para el propietario del BOX.</div>
    </div>
  )
}

function PageStub({ titulo }) {
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">{titulo}</div></div>
      </div>
      <div className="card">
        <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--text3)' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'20px', marginBottom:'8px' }}>Módulo en desarrollo</div>
          <div style={{ fontSize:'13px' }}>Esta página se conecta a Supabase. Revisa src/pages/ para implementar.</div>
        </div>
      </div>
    </div>
  )
}
