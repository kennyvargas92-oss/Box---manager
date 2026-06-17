// src/pages/Suscripciones.jsx
import { useState } from 'react'
import { usePlanes, useAtletas, crearPlan, actualizarPlan } from '../hooks/useData'

const COLORES = ['blue','accent','green','purple','yellow']

export default function Suscripciones() {
  const { data: planes,  loading, refetch } = usePlanes()
  const { data: atletas }                    = useAtletas()
  const [modalAbierto, setModalAbierto]      = useState(false)
  const [editando,     setEditando]          = useState(null)

  if (loading) return <div className="empty-state"><div className="spinner" /></div>

  // Contar atletas por plan
  const atletasPorPlan = {}
  ;(atletas || []).forEach(a => {
    if (a.plan_id) atletasPorPlan[a.plan_id] = (atletasPorPlan[a.plan_id] || 0) + 1
  })

  function abrirEditar(plan) {
    setEditando(plan)
    setModalAbierto(true)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Suscripciones</div>
          <div className="page-sub">{planes?.length || 0} planes activos</div>
        </div>
        <button className="btn btn-accent" onClick={() => { setEditando(null); setModalAbierto(true) }}>+ Nuevo plan</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {(planes || []).map(p => (
          <div key={p.id} className="card" style={{ borderTop: `3px solid var(--${p.color || 'blue'})`, cursor: 'pointer' }} onClick={() => abrirEditar(p)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>{p.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{p.descripcion}</div>
              </div>
              <span className="badge badge-gray">{p.tipo}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: `var(--${p.color || 'blue'})`, marginBottom: 8 }}>
              ${Number(p.precio).toLocaleString('es-CO')}
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text2)' }}>
              <span>⏱ {p.duracion_dias} días</span>
              <span>👥 Hasta {p.max_beneficiarios} persona{p.max_beneficiarios > 1 ? 's' : ''}</span>
            </div>
            <hr className="divider" style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text3)' }}>Atletas activos</span>
              <span style={{ fontWeight: 600 }}>{atletasPorPlan[p.id] || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {modalAbierto && (
        <ModalPlan
          plan={editando}
          onClose={() => setModalAbierto(false)}
          onSaved={() => { setModalAbierto(false); refetch() }}
        />
      )}
    </div>
  )
}

function ModalPlan({ plan, onClose, onSaved }) {
  const esEdicion = !!plan
  const [form, setForm] = useState({
    nombre:            plan?.nombre || '',
    descripcion:       plan?.descripcion || '',
    precio:            plan?.precio || '',
    duracion_dias:     plan?.duracion_dias || 30,
    max_beneficiarios: plan?.max_beneficiarios || 1,
    tipo:              plan?.tipo || 'general',
    color:             plan?.color || 'blue',
    activo:            plan?.activo ?? true,
  })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  function set(field, val) { setForm(prev => ({ ...prev, [field]: val })) }

  async function handleGuardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!form.precio)        { setError('El precio es obligatorio'); return }
    setGuardando(true); setError('')
    const payload = { ...form, precio: Number(form.precio), duracion_dias: Number(form.duracion_dias), max_beneficiarios: Number(form.max_beneficiarios) }
    const res = esEdicion ? await actualizarPlan(plan.id, payload) : await crearPlan(payload)
    if (res.error) { setError(res.error); setGuardando(false); return }
    onSaved()
  }

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{esEdicion ? 'Editar plan' : 'Nuevo plan'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Nombre *</label>
              <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="General, Personalizado..." />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                <option value="general">General</option>
                <option value="personal">Personalizado</option>
                <option value="grupal">Grupal</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <input type="text" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Breve descripción del plan" />
          </div>
          <div className="form-row three">
            <div className="form-group">
              <label>Precio *</label>
              <input type="number" value={form.precio} onChange={e => set('precio', e.target.value)} min="0" placeholder="$" />
            </div>
            <div className="form-group">
              <label>Duración (días)</label>
              <input type="number" value={form.duracion_dias} onChange={e => set('duracion_dias', e.target.value)} min="1" />
            </div>
            <div className="form-group">
              <label>Máx. personas</label>
              <input type="number" value={form.max_beneficiarios} onChange={e => set('max_beneficiarios', e.target.value)} min="1" max="10" />
            </div>
          </div>
          <div className="form-group">
            <label>Color de la tarjeta</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORES.map(c => (
                <div key={c} onClick={() => set('color', c)} style={{
                  width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                  background: `var(--${c})`,
                  border: form.color === c ? '3px solid white' : '3px solid transparent',
                  transition: 'border 0.15s'
                }} />
              ))}
            </div>
          </div>
          {esEdicion && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}>
                <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} style={{ width: 'auto' }} />
                Plan activo
              </label>
            </div>
          )}
          {error && <div className="alert-error">{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleGuardar} disabled={guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear plan'}
          </button>
        </div>
      </div>
    </div>
  )
}
