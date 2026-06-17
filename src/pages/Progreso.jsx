// src/pages/Progreso.jsx
import { useState } from 'react'
import { useAtletas, useMedicionesPorAtleta, registrarMedicion } from '../hooks/useData'
import { supabase } from '../lib/supabase'

export default function Progreso() {
  const { data: atletas, loading } = useAtletas()
  const [atletaId, setAtletaId]   = useState('')
  const [modalMed, setModalMed]   = useState(false)

  if (loading) return <div className="empty-state"><div className="spinner" /></div>

  const atleta = atletas?.find(a => a.id === atletaId)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Progreso atletas</div>
          <div className="page-sub">Evolución de peso y medidas corporales</div>
        </div>
        {atletaId && <button className="btn btn-accent" onClick={() => setModalMed(true)}>+ Registrar medición</button>}
      </div>

      {/* Selector de atleta */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Seleccionar atleta</label>
          <select value={atletaId} onChange={e => setAtletaId(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {(atletas || []).filter(a => a.activo).map(a => (
              <option key={a.id} value={a.id}>{a.nombre} — {a.cc}</option>
            ))}
          </select>
        </div>
      </div>

      {atletaId && atleta && (
        <DetalleProgreso atleta={atleta} atletaId={atletaId} />
      )}

      {!atletaId && (
        <div className="empty-state">
          <div className="empty-state-icon">△</div>
          <div className="empty-state-text">Selecciona un atleta para ver su progreso</div>
        </div>
      )}

      {modalMed && (
        <ModalMedicion
          atletaId={atletaId}
          atleta={atleta}
          onClose={() => setModalMed(false)}
          onSaved={() => setModalMed(false)}
        />
      )}
    </div>
  )
}

function DetalleProgreso({ atleta, atletaId }) {
  const { data: mediciones, loading } = useMedicionesPorAtleta(atletaId)

  const pesoInicial = atleta.peso_inicial
  const pesoActual  = atleta.peso_actual
  const difPeso     = pesoActual && pesoInicial ? (pesoActual - pesoInicial).toFixed(1) : null

  const medidas = ['cuello','brazo','torax','cintura','cadera','muslo']

  if (loading) return <div className="empty-state"><div className="spinner" /></div>

  const ultimaMed = mediciones?.length > 0 ? mediciones[mediciones.length - 1] : null

  return (
    <div>
      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Peso inicial</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>
            {pesoInicial ? `${pesoInicial} kg` : '—'}
          </div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid var(--blue)' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Peso actual</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>
            {pesoActual ? `${pesoActual} kg` : '—'}
          </div>
        </div>
        <div className="card" style={{ borderLeft: `3px solid ${difPeso < 0 ? 'var(--green)' : difPeso > 0 ? 'var(--red)' : 'var(--border)'}` }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Diferencia</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: difPeso < 0 ? 'var(--green)' : difPeso > 0 ? 'var(--red)' : 'var(--text)' }}>
            {difPeso !== null ? `${difPeso > 0 ? '+' : ''}${difPeso} kg` : '—'}
          </div>
        </div>
      </div>

      {/* Medidas iniciales vs actuales */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">Medidas corporales (cm)</div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
          {medidas.map(m => {
            const inicial  = atleta[`med_${m}`]
            const actual   = ultimaMed ? ultimaMed[`med_${m}`] : null
            const dif      = actual && inicial ? (actual - inicial).toFixed(1) : null
            return (
              <div key={m} style={{ background: 'var(--dark3)', borderRadius: 'var(--radius)', padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'capitalize' }}>{m}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 18 }}>{actual || inicial || '—'}</span>
                  {inicial && actual && <span style={{ fontSize: 11, color: dif < 0 ? 'var(--green)' : dif > 0 ? 'var(--red)' : 'var(--text3)' }}>{dif > 0 ? '+' : ''}{dif}</span>}
                </div>
                {inicial && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Inicio: {inicial}</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Historial de mediciones */}
      {mediciones && mediciones.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="card-title">Historial de mediciones</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th><th>Peso</th><th>Cuello</th><th>Brazo</th>
                  <th>Tórax</th><th>Cintura</th><th>Cadera</th><th>Muslo</th>
                </tr>
              </thead>
              <tbody>
                {[...mediciones].reverse().map(m => (
                  <tr key={m.id}>
                    <td style={{ fontSize: 12 }}>{new Date(m.fecha + 'T12:00').toLocaleDateString('es-CO')}</td>
                    <td>{m.peso ? `${m.peso}kg` : '—'}</td>
                    <td>{m.med_cuello || '—'}</td>
                    <td>{m.med_brazo || '—'}</td>
                    <td>{m.med_torax || '—'}</td>
                    <td>{m.med_cintura || '—'}</td>
                    <td>{m.med_cadera || '—'}</td>
                    <td>{m.med_muslo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function ModalMedicion({ atletaId, atleta, onClose, onSaved }) {
  const { refetch } = useMedicionesPorAtleta(atletaId)
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    peso: atleta?.peso_actual || '',
    med_cuello: '', med_brazo: '', med_torax: '',
    med_cintura: '', med_cadera: '', med_muslo: '', notas: ''
  })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  function set(field, val) { setForm(prev => ({ ...prev, [field]: val })) }

  async function handleGuardar() {
    setGuardando(true); setError('')
    const payload = { atleta_id: atletaId, fecha: form.fecha, notas: form.notas || null }
    const campos = ['peso','med_cuello','med_brazo','med_torax','med_cintura','med_cadera','med_muslo']
    campos.forEach(c => { payload[c] = form[c] ? Number(form[c]) : null })

    const { error: errM } = await registrarMedicion(payload)
    if (errM) { setError(errM); setGuardando(false); return }

    // Actualizar peso_actual en atleta
    if (form.peso) {
      await supabase.from('atletas').update({ peso_actual: Number(form.peso) }).eq('id', atletaId)
    }
    refetch()
    onSaved()
  }

  return (
    <div className="modal-overlay open">
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div className="modal-title">Nueva medición — {atleta?.nombre}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Peso actual (kg)</label>
              <input type="number" step="0.1" value={form.peso} onChange={e => set('peso', e.target.value)} />
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text3)', margin: '12px 0 8px' }}>
            Medidas corporales (cm)
          </div>
          <div className="form-row three">
            {['med_cuello','med_brazo','med_torax','med_cintura','med_cadera','med_muslo'].map(f => (
              <div key={f} className="form-group">
                <label style={{ textTransform: 'capitalize' }}>{f.replace('med_','')}</label>
                <input type="number" step="0.1" value={form[f]} onChange={e => set(f, e.target.value)} placeholder="cm" />
              </div>
            ))}
          </div>
          <div className="form-group">
            <label>Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Observaciones..." />
          </div>
          {error && <div className="alert-error">{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleGuardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar medición'}
          </button>
        </div>
      </div>
    </div>
  )
}
