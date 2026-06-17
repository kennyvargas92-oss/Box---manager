// src/pages/Rutinas.jsx
import { useState } from 'react'
import { useRutinas, crearRutina } from '../hooks/useData'
import { useAuth } from '../context/AuthContext'

const TIPOS      = ['AMRAP','For Time','EMOM','Tabata','Hero WOD','Fuerza','Intervalos','Chipper','Libre']
const CATEGORIAS = ['Mixto','Fuerza','Cardio','Técnica','Movilidad','Metabólico','Fortalecimiento']

export default function Rutinas() {
  const { data: rutinas, loading, refetch } = useRutinas()
  const { perfil } = useAuth()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [verDetalle,   setVerDetalle]   = useState(null)

  if (loading) return <div className="empty-state"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Rutinas / WOD</div>
          <div className="page-sub">{rutinas?.length || 0} rutinas registradas</div>
        </div>
        <button className="btn btn-accent" onClick={() => setModalAbierto(true)}>+ Nueva rutina</button>
      </div>

      {(!rutinas || rutinas.length === 0) ? (
        <div className="empty-state">
          <div className="empty-state-icon">◆</div>
          <div className="empty-state-text">Sin rutinas registradas aún</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {rutinas.map(r => (
            <div key={r.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setVerDetalle(r)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    {r.nombre && <span style={{ fontWeight: 600, fontSize: 15 }}>{r.nombre}</span>}
                    {(r.tipos || []).map(t => <span key={t} className="badge badge-accent" style={{ fontSize: 9 }}>{t}</span>)}
                    {(r.categorias || []).map(c => <span key={c} className="badge badge-blue" style={{ fontSize: 9 }}>{c}</span>)}
                  </div>
                  {r.descripcion && (
                    <div style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'pre-line' }}>{r.descripcion}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {new Date(r.fecha + 'T12:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </div>
                  {r.duracion && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.duracion} min</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAbierto && (
        <ModalRutina
          perfil={perfil}
          onClose={() => setModalAbierto(false)}
          onSaved={() => { setModalAbierto(false); refetch() }}
        />
      )}

      {verDetalle && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{verDetalle.nombre || 'WOD'}</div>
              <button className="modal-close" onClick={() => setVerDetalle(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {(verDetalle.tipos || []).map(t => <span key={t} className="badge badge-accent">{t}</span>)}
                {(verDetalle.categorias || []).map(c => <span key={c} className="badge badge-blue">{c}</span>)}
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 13, color: 'var(--text2)' }}>
                <span>📅 {new Date(verDetalle.fecha + 'T12:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                {verDetalle.duracion && <span>⏱ {verDetalle.duracion} min</span>}
              </div>
              {verDetalle.descripcion && (
                <div style={{ background: 'var(--dark3)', borderRadius: 'var(--radius)', padding: 16, fontSize: 14, whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                  {verDetalle.descripcion}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setVerDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ModalRutina({ perfil, onClose, onSaved }) {
  const [nombre,      setNombre]      = useState('')
  const [tipos,       setTipos]       = useState([])
  const [categorias,  setCategorias]  = useState([])
  const [duracion,    setDuracion]    = useState(20)
  const [descripcion, setDescripcion] = useState('')
  const [fecha,       setFecha]       = useState(new Date().toISOString().split('T')[0])
  const [error,       setError]       = useState('')
  const [guardando,   setGuardando]   = useState(false)

  function toggleTipo(t)     { setTipos(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]) }
  function toggleCategoria(c){ setCategorias(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]) }

  async function handleGuardar() {
    if (tipos.length === 0) { setError('Selecciona al menos un tipo'); return }
    setGuardando(true); setError('')
    const { error } = await crearRutina({
      nombre: nombre || null, tipos, categorias, duracion: Number(duracion),
      descripcion: descripcion || null, fecha, creado_por: perfil?.id || null,
    })
    if (error) { setError(error); setGuardando(false); return }
    onSaved()
  }

  const chipStyle = (activo) => ({
    padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
    background: activo ? 'var(--accent-dim)' : 'var(--dark3)',
    border: `1px solid ${activo ? 'var(--accent)' : 'var(--border)'}`,
    color: activo ? 'var(--accent)' : 'var(--text2)', transition: 'all 0.15s'
  })

  return (
    <div className="modal-overlay open">
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div className="modal-title">Nueva rutina / WOD</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Nombre (opcional)</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder='Ej: "Murph", "Fran"...' />
            </div>
            <div className="form-group">
              <label>Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Tipo de WOD *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TIPOS.map(t => (
                <span key={t} style={chipStyle(tipos.includes(t))} onClick={() => toggleTipo(t)}>{t}</span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Categoría</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORIAS.map(c => (
                <span key={c} style={chipStyle(categorias.includes(c))} onClick={() => toggleCategoria(c)}>{c}</span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Duración estimada (min)</label>
            <input type="number" value={duracion} onChange={e => setDuracion(e.target.value)} min="1" max="120" />
          </div>

          <div className="form-group">
            <label>Descripción / Movimientos</label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
              rows={5} placeholder="21-15-9&#10;Thrusters 43kg&#10;Pull-ups" />
          </div>

          {error && <div className="alert-error">{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleGuardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar rutina'}
          </button>
        </div>
      </div>
    </div>
  )
}
