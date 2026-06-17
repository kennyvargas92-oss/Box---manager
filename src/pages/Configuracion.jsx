// src/pages/Configuracion.jsx
import { useState, useEffect } from 'react'
import { useConfiguracion, guardarConfiguracion } from '../hooks/useData'

const PALETAS = [
  { id: 'naranja', nombre: 'Naranja', color: '#e8430a' },
  { id: 'rojo',    nombre: 'Rojo',    color: '#ef4444' },
  { id: 'azul',    nombre: 'Azul',    color: '#3b82f6' },
  { id: 'verde',   nombre: 'Verde',   color: '#22c55e' },
  { id: 'morado',  nombre: 'Morado',  color: '#a855f7' },
]

export default function Configuracion() {
  const { data, loading, refetch } = useConfiguracion()
  const [form, setForm]     = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [exito,     setExito]     = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (data) setForm({ ...data })
  }, [data])

  function set(field, val) { setForm(prev => ({ ...prev, [field]: val })) }

  async function handleGuardar() {
    if (!form.nombre_box?.trim()) { setError('El nombre del BOX es obligatorio'); return }
    setGuardando(true); setError(''); setExito(false)
    const { error } = await guardarConfiguracion(form)
    if (error) { setError(error); setGuardando(false); return }
    setExito(true); setGuardando(false)
    refetch()
    setTimeout(() => setExito(false), 3000)
  }

  if (loading || !form) return <div className="empty-state"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Configuración BOX</div>
          <div className="page-sub">Información y apariencia del sistema</div>
        </div>
        <button className="btn btn-accent" onClick={handleGuardar} disabled={guardando}>
          {guardando ? 'Guardando...' : exito ? '✓ Guardado' : 'Guardar cambios'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Información del BOX */}
        <div className="card">
          <div className="card-header"><div className="card-title">Información del BOX</div></div>
          <div className="form-group">
            <label>Nombre del BOX *</label>
            <input type="text" value={form.nombre_box || ''} onChange={e => set('nombre_box', e.target.value)} placeholder="Mi BOX CrossFit" />
          </div>
          <div className="form-group">
            <label>Tagline / Slogan</label>
            <input type="text" value={form.tagline || ''} onChange={e => set('tagline', e.target.value)} placeholder="Tu mejor versión empieza aquí" />
          </div>
          <div className="form-group">
            <label>Ciudad</label>
            <input type="text" value={form.ciudad || ''} onChange={e => set('ciudad', e.target.value)} placeholder="Florencia, Caquetá" />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input type="text" value={form.telefono || ''} onChange={e => set('telefono', e.target.value)} placeholder="+57 300..." />
          </div>
          <div className="form-group">
            <label>Correo</label>
            <input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="mibox@gmail.com" />
          </div>
        </div>

        {/* Redes sociales */}
        <div className="card">
          <div className="card-header"><div className="card-title">Redes sociales</div></div>
          <div className="form-group">
            <label>Instagram</label>
            <input type="text" value={form.instagram || ''} onChange={e => set('instagram', e.target.value)} placeholder="@mibox" />
          </div>
          <div className="form-group">
            <label>Facebook</label>
            <input type="text" value={form.facebook || ''} onChange={e => set('facebook', e.target.value)} placeholder="facebook.com/mibox" />
          </div>
          <div className="form-group">
            <label>WhatsApp</label>
            <input type="text" value={form.whatsapp || ''} onChange={e => set('whatsapp', e.target.value)} placeholder="+57 300..." />
          </div>

          {/* Paleta de colores */}
          <div className="card-header" style={{ marginTop: 16 }}><div className="card-title">Color del sistema</div></div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
            {PALETAS.map(p => (
              <div key={p.id} onClick={() => set('paleta', p.id)} style={{ textAlign: 'center', cursor: 'pointer' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: p.color, margin: '0 auto 6px',
                  border: form.paleta === p.id ? '3px solid white' : '3px solid transparent',
                  boxShadow: form.paleta === p.id ? `0 0 0 2px ${p.color}` : 'none',
                  transition: 'all 0.15s'
                }} />
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>{p.nombre}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error  && <div className="alert-error" style={{ marginTop: 12 }}>{error}</div>}
      {exito  && <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--green-dim)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius)', color: 'var(--green)', fontSize: 13 }}>✓ Configuración guardada correctamente</div>}
    </div>
  )
}
