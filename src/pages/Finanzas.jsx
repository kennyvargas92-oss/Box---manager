// src/pages/Finanzas.jsx
import { useState } from 'react'
import { useResumenFinanzas, registrarGasto } from '../hooks/useData'
import { supabase } from '../lib/supabase'

export default function Finanzas() {
  const { data, loading, refetch } = useResumenFinanzas()
  const [modalGasto, setModalGasto] = useState(false)

  if (loading) return <div className="empty-state"><div className="spinner" /></div>

  const ingresos  = (data?.ingresosMensualidades || 0) + (data?.ingresosTienda || 0)
  const gastos    = (data?.gastosFijos || 0) + (data?.gastosVariables || 0)
  const utilidad  = ingresos - gastos

  const mes = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Finanzas BOX</div>
          <div className="page-sub" style={{ textTransform: 'capitalize' }}>{mes}</div>
        </div>
        <button className="btn btn-accent" onClick={() => setModalGasto(true)}>+ Registrar gasto</button>
      </div>

      {/* Tarjetas principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ borderLeft: '3px solid var(--green)' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Ingresos totales</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--green)' }}>
            ${ingresos.toLocaleString('es-CO')}
          </div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid var(--red)' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Gastos totales</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--red)' }}>
            ${gastos.toLocaleString('es-CO')}
          </div>
        </div>
        <div className="card" style={{ borderLeft: `3px solid ${utilidad >= 0 ? 'var(--green)' : 'var(--red)'}` }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Utilidad neta</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: utilidad >= 0 ? 'var(--green)' : 'var(--red)' }}>
            ${utilidad.toLocaleString('es-CO')}
          </div>
        </div>
      </div>

      {/* Desglose */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Ingresos */}
        <div className="card">
          <div className="card-header"><div className="card-title">Ingresos</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <FilaFinanza label="Mensualidades" monto={data?.ingresosMensualidades || 0} color="var(--green)" />
            <FilaFinanza label="Tienda" monto={data?.ingresosTienda || 0} color="var(--blue)" />
          </div>
        </div>

        {/* Gastos */}
        <div className="card">
          <div className="card-header"><div className="card-title">Gastos</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <FilaFinanza label="Gastos fijos" monto={data?.gastosFijos || 0} color="var(--red)" />
            <FilaFinanza label="Gastos variables" monto={data?.gastosVariables || 0} color="#f59e0b" />
          </div>

          {(data?.gastos_raw || []).length > 0 && (
            <>
              <hr className="divider" style={{ margin: '16px 0' }} />
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10 }}>
                Detalle de gastos
              </div>
              {(data.gastos_raw || []).map((g, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13 }}>
                  <div>
                    <span>{g.concepto}</span>
                    <span className={`badge ${g.categoria === 'Fijo' ? 'badge-blue' : 'badge-yellow'}`} style={{ marginLeft: 8, fontSize: 9 }}>{g.categoria}</span>
                  </div>
                  <span style={{ color: 'var(--red)', fontWeight: 600 }}>${Number(g.monto).toLocaleString('es-CO')}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {modalGasto && (
        <ModalGasto
          onClose={() => setModalGasto(false)}
          onSaved={() => { setModalGasto(false); refetch() }}
        />
      )}
    </div>
  )
}

function FilaFinanza({ label, monto, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</span>
      <span style={{ fontWeight: 700, color }}>${monto.toLocaleString('es-CO')}</span>
    </div>
  )
}

function ModalGasto({ onClose, onSaved }) {
  const [concepto,  setConcepto]  = useState('')
  const [monto,     setMonto]     = useState('')
  const [categoria, setCategoria] = useState('Variable')
  const [fecha,     setFecha]     = useState(new Date().toISOString().split('T')[0])
  const [error,     setError]     = useState('')
  const [guardando, setGuardando] = useState(false)

  async function handleGuardar() {
    if (!concepto.trim()) { setError('El concepto es obligatorio'); return }
    if (!monto)           { setError('El monto es obligatorio'); return }
    setGuardando(true); setError('')
    const { error } = await registrarGasto({ concepto, monto: Number(monto), categoria, fecha })
    if (error) { setError(error); setGuardando(false); return }
    onSaved()
  }

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Registrar gasto</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Concepto *</label>
            <input type="text" value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej: Arriendo, servicios, proteína..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Monto *</label>
              <input type="number" value={monto} onChange={e => setMonto(e.target.value)} min="0" placeholder="$" />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)}>
                <option value="Fijo">Fijo</option>
                <option value="Variable">Variable</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          {error && <div className="alert-error">{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleGuardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Registrar gasto'}
          </button>
        </div>
      </div>
    </div>
  )
}
