// src/pages/Metricas.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Metricas() {
  const [datos,   setDatos]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      setLoading(true)
      const hoy    = new Date()
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
      const fin    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0]

      const [resAtletas, resPagos, resAccesos, resVentas, resGastos] = await Promise.all([
        supabase.from('atletas').select('id, activo, created_at, plan_id, planes(nombre)'),
        supabase.from('pagos').select('monto, fecha_pago, fecha_vence').gte('fecha_pago', inicio).lte('fecha_pago', fin),
        supabase.from('accesos').select('id, fecha').gte('fecha', inicio).lte('fecha', fin),
        supabase.from('ventas').select('total, created_at').gte('created_at', inicio),
        supabase.from('gastos').select('monto, categoria').gte('fecha', inicio).lte('fecha', fin),
      ])

      const atletas  = resAtletas.data  || []
      const pagos    = resPagos.data    || []
      const accesos  = resAccesos.data  || []
      const ventas   = resVentas.data   || []
      const gastos   = resGastos.data   || []

      // Accesos por día del mes
      const accesosPorDia = {}
      accesos.forEach(a => {
        const d = a.fecha
        accesosPorDia[d] = (accesosPorDia[d] || 0) + 1
      })

      // Atletas por plan
      const porPlan = {}
      atletas.filter(a => a.activo).forEach(a => {
        const nombre = a.planes?.nombre || 'Sin plan'
        porPlan[nombre] = (porPlan[nombre] || 0) + 1
      })

      setDatos({
        totalAtletas:  atletas.length,
        atletasActivos: atletas.filter(a => a.activo).length,
        ingresosMes:   pagos.reduce((s, p) => s + Number(p.monto), 0),
        ingresosTienda: ventas.reduce((s, v) => s + Number(v.total), 0),
        gastosMes:     gastos.reduce((s, g) => s + Number(g.monto), 0),
        accesosMes:    accesos.length,
        promedioAccesosDia: accesos.length > 0 ? Math.round(accesos.length / hoy.getDate()) : 0,
        porPlan,
        accesosPorDia,
      })
      setLoading(false)
    }
    cargar()
  }, [])

  if (loading) return <div className="empty-state"><div className="spinner" /></div>

  const mes = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  const utilidad = (datos.ingresosMes + datos.ingresosTienda) - datos.gastosMes

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Métricas</div>
          <div className="page-sub" style={{ textTransform: 'capitalize' }}>{mes}</div>
        </div>
      </div>

      {/* KPIs principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <KPI label="Atletas activos"   valor={datos.atletasActivos} color="var(--accent)"  icono="◎" />
        <KPI label="Ingresos del mes"  valor={`$${datos.ingresosMes.toLocaleString('es-CO')}`}  color="var(--green)"  icono="$" />
        <KPI label="Accesos del mes"   valor={datos.accesosMes}     color="var(--blue)"   icono="▶" />
        <KPI label="Utilidad neta"     valor={`$${utilidad.toLocaleString('es-CO')}`}      color={utilidad >= 0 ? 'var(--green)' : 'var(--red)'} icono="◆" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Distribución por plan */}
        <div className="card">
          <div className="card-header"><div className="card-title">Atletas por plan</div></div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(datos.porPlan).map(([plan, count]) => {
              const pct = Math.round((count / datos.atletasActivos) * 100)
              return (
                <div key={plan}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{plan}</span>
                    <span style={{ fontWeight: 600 }}>{count} ({pct}%)</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {Object.keys(datos.porPlan).length === 0 && (
              <div style={{ color: 'var(--text3)', fontSize: 13 }}>Sin datos</div>
            )}
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="card">
          <div className="card-header"><div className="card-title">Resumen financiero</div></div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <FilaMetrica label="Ingresos mensualidades" valor={datos.ingresosMes} color="var(--green)" />
            <FilaMetrica label="Ingresos tienda"        valor={datos.ingresosTienda} color="var(--blue)" />
            <FilaMetrica label="Gastos del mes"         valor={datos.gastosMes} color="var(--red)" />
            <hr className="divider" />
            <FilaMetrica label="Utilidad neta" valor={utilidad} color={utilidad >= 0 ? 'var(--green)' : 'var(--red)'} bold />
          </div>
        </div>

        {/* Accesos del mes */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div className="card-title">Accesos del mes</div>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>Promedio: {datos.promedioAccesosDia} por día</span>
          </div>
          {Object.keys(datos.accesosPorDia).length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 12 }}>Sin accesos registrados este mes</div>
          ) : (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 12, alignItems: 'flex-end' }}>
              {Object.entries(datos.accesosPorDia).sort(([a],[b]) => a.localeCompare(b)).map(([fecha, cnt]) => {
                const maxCnt = Math.max(...Object.values(datos.accesosPorDia))
                const h = Math.max(20, Math.round((cnt / maxCnt) * 80))
                return (
                  <div key={fecha} style={{ textAlign: 'center', minWidth: 28 }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>{cnt}</div>
                    <div style={{ width: 24, height: h, background: 'var(--accent)', borderRadius: 4, margin: '0 auto' }} />
                    <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 4 }}>
                      {new Date(fecha + 'T12:00').getDate()}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KPI({ label, valor, color, icono }) {
  return (
    <div className="card" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 20, marginBottom: 8, color }}>{icono}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color }}>{valor}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function FilaMetrica({ label, valor, color, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: bold ? 14 : 13 }}>
      <span style={{ color: bold ? 'var(--text)' : 'var(--text2)', fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ color, fontWeight: 700 }}>${valor.toLocaleString('es-CO')}</span>
    </div>
  )
}
