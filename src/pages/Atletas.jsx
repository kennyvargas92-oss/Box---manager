// src/pages/Atletas.jsx
import { useState } from 'react'
import { useAtletas, usePlanes, crearAtleta, actualizarAtleta } from '../hooks/useData'
import { useAuth } from '../context/AuthContext'

function getInitials(nombre = '') {
  return nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function avatarColor(nombre = '') {
  const colors = ['', 'green', 'blue']
  const idx = nombre.length % colors.length
  return colors[idx]
}

const ESTADO_VACIO = {
  cc: '', nombre: '', edad: '', correo: '', whatsapp: '',
  peso_inicial: '', peso_actual: '', plan_id: '',
  enfermedades: '', condiciones_especiales: '', lesiones: '',
  med_cuello: '', med_brazo: '', med_torax: '', med_cintura: '', med_cadera: '', med_muslo: '',
  emerg_nombre: '', emerg_relacion: '', emerg_telefono: '',
  fecha_inicio: new Date().toISOString().split('T')[0],
  activo: true,
}

export default function Atletas() {
  const { data: atletas, loading, refetch } = useAtletas()
  const { data: planes } = usePlanes()
  const { esDueno } = useAuth()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando,     setEditando]     = useState(null)
  const [busqueda,     setBusqueda]     = useState('')
  const [filtro,       setFiltro]       = useState('todos') // todos | activos | inactivos

  function abrirNuevo() {
    setEditando(null)
    setModalAbierto(true)
  }

  function abrirEditar(atleta) {
    setEditando(atleta)
    setModalAbierto(true)
  }

  const lista = (atletas || []).filter(a => {
    if (filtro === 'activos'   && !a.activo) return false
    if (filtro === 'inactivos' &&  a.activo) return false
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      return a.nombre.toLowerCase().includes(q) || a.cc.includes(q)
    }
    return true
  })

  const activos = (atletas || []).filter(a => a.activo).length

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Atletas</div>
          <div className="page-sub">{atletas?.length || 0} registrados · {activos} activos</div>
        </div>
        <button className="btn btn-accent" onClick={abrirNuevo}>+ Nuevo atleta</button>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por nombre o cédula..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: 200, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '9px 14px', color: 'var(--text)', fontSize: 13 }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {['todos', 'activos', 'inactivos'].map(f => (
            <button key={f}
              className={`btn btn-sm ${filtro === f ? 'btn-accent' : ''}`}
              onClick={() => setFiltro(f)}
              style={{ textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="empty-state"><div className="spinner" /></div>
      ) : lista.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◎</div>
          <div className="empty-state-text">
            {busqueda ? 'Sin resultados para tu búsqueda' : 'Sin atletas registrados aún'}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Atleta</th>
                  <th>Cédula</th>
                  <th>Plan</th>
                  <th>Inicio</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map(a => (
                  <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => abrirEditar(a)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className={`avatar ${avatarColor(a.nombre)}`}>{getInitials(a.nombre)}</div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{a.nombre}</div>
                          {a.whatsapp && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{a.whatsapp}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{a.cc}</td>
                    <td>{a.planes?.nombre || '—'}</td>
                    <td>{a.fecha_inicio ? new Date(a.fecha_inicio + 'T12:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td>
                      {a.activo
                        ? <span className="badge badge-green">Activo</span>
                        : <span className="badge badge-gray">Inactivo</span>}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text3)' }}>›</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalAbierto && (
        <ModalAtleta
          atleta={editando}
          planes={planes || []}
          esDueno={esDueno}
          onClose={() => setModalAbierto(false)}
          onSaved={() => { setModalAbierto(false); refetch() }}
        />
      )}
    </div>
  )
}

// ============================================================
// MODAL DE REGISTRO / EDICIÓN
// ============================================================
function ModalAtleta({ atleta, planes, esDueno, onClose, onSaved }) {
  const esEdicion = !!atleta
  const [form, setForm] = useState(() => atleta ? {
    cc: atleta.cc || '', nombre: atleta.nombre || '', edad: atleta.edad || '',
    correo: atleta.correo || '', whatsapp: atleta.whatsapp || '',
    peso_inicial: atleta.peso_inicial || '', peso_actual: atleta.peso_actual || '',
    plan_id: atleta.plan_id || '',
    enfermedades: atleta.enfermedades || '', condiciones_especiales: atleta.condiciones_especiales || '', lesiones: atleta.lesiones || '',
    med_cuello: atleta.med_cuello || '', med_brazo: atleta.med_brazo || '', med_torax: atleta.med_torax || '',
    med_cintura: atleta.med_cintura || '', med_cadera: atleta.med_cadera || '', med_muslo: atleta.med_muslo || '',
    emerg_nombre: atleta.emerg_nombre || '', emerg_relacion: atleta.emerg_relacion || '', emerg_telefono: atleta.emerg_telefono || '',
    fecha_inicio: atleta.fecha_inicio || new Date().toISOString().split('T')[0],
    activo: atleta.activo,
  } : ESTADO_VACIO)

  const [error,     setError]     = useState('')
  const [guardando, setGuardando] = useState(false)

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleGuardar() {
    if (!form.cc.trim())     { setError('La cédula es obligatoria'); return }
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }

    setGuardando(true); setError('')

    const numericFields = ['edad','peso_inicial','peso_actual','med_cuello','med_brazo','med_torax','med_cintura','med_cadera','med_muslo']
    const payload = { ...form }
    numericFields.forEach(f => { payload[f] = payload[f] === '' ? null : Number(payload[f]) })
    payload.plan_id = payload.plan_id || null

    let res
    if (esEdicion) res = await actualizarAtleta(atleta.id, payload)
    else           res = await crearAtleta({ ...payload, peso_actual: payload.peso_actual ?? payload.peso_inicial })

    if (res.error) { setError(res.error); setGuardando(false); return }
    onSaved()
  }

  return (
    <div className="modal-overlay open">
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div className="modal-title">{esEdicion ? 'Editar atleta' : 'Nuevo atleta'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>

          <div className="form-row">
            <div className="form-group">
              <label>Cédula *</label>
              <input type="text" value={form.cc} onChange={e => set('cc', e.target.value)} placeholder="Número de cédula" disabled={esEdicion} />
            </div>
            <div className="form-group">
              <label>Nombre completo *</label>
              <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre y apellido" />
            </div>
          </div>

          <div className="form-row three">
            <div className="form-group">
              <label>Edad</label>
              <input type="number" value={form.edad} onChange={e => set('edad', e.target.value)} min="0" max="99" />
            </div>
            <div className="form-group">
              <label>Correo</label>
              <input type="email" value={form.correo} onChange={e => set('correo', e.target.value)} placeholder="correo@ejemplo.com" />
            </div>
            <div className="form-group">
              <label>WhatsApp</label>
              <input type="text" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="+57 300..." />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha de inicio</label>
              <input type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Plan</label>
              <select value={form.plan_id} onChange={e => set('plan_id', e.target.value)}>
                <option value="">— Sin asignar —</option>
                {planes.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} — ${Number(p.precio).toLocaleString('es-CO')}</option>
                ))}
              </select>
            </div>
          </div>

          <hr className="divider" />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 12 }}>
            Peso corporal (kg)
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Peso inicial</label>
              <input type="number" step="0.1" min="0" value={form.peso_inicial} onChange={e => set('peso_inicial', e.target.value)} placeholder="kg" />
            </div>
            <div className="form-group">
              <label>Peso actual</label>
              <input type="number" step="0.1" min="0" value={form.peso_actual} onChange={e => set('peso_actual', e.target.value)} placeholder="kg" />
            </div>
          </div>

          <hr className="divider" />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 12 }}>
            Medidas corporales (cm)
          </div>
          <div className="form-row three">
            <div className="form-group"><label>Cuello</label><input type="number" step="0.1" min="0" value={form.med_cuello} onChange={e => set('med_cuello', e.target.value)} placeholder="cm" /></div>
            <div className="form-group"><label>Brazo derecho</label><input type="number" step="0.1" min="0" value={form.med_brazo} onChange={e => set('med_brazo', e.target.value)} placeholder="cm" /></div>
            <div className="form-group"><label>Tórax</label><input type="number" step="0.1" min="0" value={form.med_torax} onChange={e => set('med_torax', e.target.value)} placeholder="cm" /></div>
          </div>
          <div className="form-row three">
            <div className="form-group"><label>Cintura</label><input type="number" step="0.1" min="0" value={form.med_cintura} onChange={e => set('med_cintura', e.target.value)} placeholder="cm" /></div>
            <div className="form-group"><label>Cadera</label><input type="number" step="0.1" min="0" value={form.med_cadera} onChange={e => set('med_cadera', e.target.value)} placeholder="cm" /></div>
            <div className="form-group"><label>Muslo derecho</label><input type="number" step="0.1" min="0" value={form.med_muslo} onChange={e => set('med_muslo', e.target.value)} placeholder="cm" /></div>
          </div>

          <hr className="divider" />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 12 }}>
            Salud y condiciones
          </div>
          <div className="form-group">
            <label>Condiciones médicas</label>
            <textarea value={form.enfermedades} onChange={e => set('enfermedades', e.target.value)} placeholder="Diagnósticos clínicos: hipertensión, diabetes, asma... (dejar vacío si ninguna)" />
          </div>
          <div className="form-group">
            <label>Condiciones especiales</label>
            <textarea value={form.condiciones_especiales} onChange={e => set('condiciones_especiales', e.target.value)} placeholder="Restricciones funcionales: no puede hacer sentadillas profundas, alergia al látex, embarazo..." />
          </div>
          <div className="form-group">
            <label>Lesiones actuales o pasadas</label>
            <textarea value={form.lesiones} onChange={e => set('lesiones', e.target.value)} placeholder="Lesión de hombro, menisco, lumbar..." />
          </div>

          <hr className="divider" />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 12 }}>
            Contacto de emergencia
          </div>
          <div className="form-row">
            <div className="form-group"><label>Nombre completo</label><input type="text" value={form.emerg_nombre} onChange={e => set('emerg_nombre', e.target.value)} placeholder="Nombre del contacto" /></div>
            <div className="form-group"><label>Parentesco</label><input type="text" value={form.emerg_relacion} onChange={e => set('emerg_relacion', e.target.value)} placeholder="Madre, esposo/a, hermano/a" /></div>
          </div>
          <div className="form-group"><label>Teléfono de emergencia</label><input type="text" value={form.emerg_telefono} onChange={e => set('emerg_telefono', e.target.value)} placeholder="+57 300..." /></div>

          {esEdicion && esDueno && (
            <>
              <hr className="divider" />
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}>
                  <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} style={{ width: 'auto' }} />
                  Atleta activo (desmarcar para dar de baja)
                </label>
              </div>
            </>
          )}

          {error && <div className="alert-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleGuardar} disabled={guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Registrar atleta'}
          </button>
        </div>
      </div>
    </div>
  )
}
