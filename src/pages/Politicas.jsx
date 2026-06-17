// src/pages/Politicas.jsx
import { useState, useEffect } from 'react'
import { usePoliticas, guardarPoliticas } from '../hooks/useData'

export default function Politicas() {
  const { data, loading, refetch } = usePoliticas()
  const [reglamento,     setReglamento]     = useState('')
  const [consentimiento, setConsentimiento] = useState('')
  const [guardando,      setGuardando]      = useState(false)
  const [exito,          setExito]          = useState(false)
  const [error,          setError]          = useState('')

  useEffect(() => {
    if (data) {
      setReglamento(data.reglamento || '')
      setConsentimiento(data.consentimiento || '')
    }
  }, [data])

  async function handleGuardar() {
    setGuardando(true); setError(''); setExito(false)
    const { error } = await guardarPoliticas({ reglamento, consentimiento })
    if (error) { setError(error); setGuardando(false); return }
    setExito(true); setGuardando(false)
    refetch()
    setTimeout(() => setExito(false), 3000)
  }

  if (loading) return <div className="empty-state"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Políticas y documentos</div>
          <div className="page-sub">Reglamento y consentimiento informado — Ley 1581/2012</div>
        </div>
        <button className="btn btn-accent" onClick={handleGuardar} disabled={guardando}>
          {guardando ? 'Guardando...' : exito ? '✓ Guardado' : 'Guardar cambios'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Reglamento interno del BOX</div>
          </div>
          <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
            <textarea
              value={reglamento}
              onChange={e => setReglamento(e.target.value)}
              rows={14}
              placeholder="Escribe aquí el reglamento interno del BOX...&#10;&#10;1. Los atletas deben respetar los equipos y el espacio.&#10;2. ..."
              style={{ fontFamily: 'inherit', lineHeight: 1.7 }}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Consentimiento informado</div>
            <span className="badge badge-gray" style={{ fontSize: 10 }}>Ley 1581/2012</span>
          </div>
          <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
            <textarea
              value={consentimiento}
              onChange={e => setConsentimiento(e.target.value)}
              rows={14}
              placeholder="Escribe aquí el consentimiento informado...&#10;&#10;Yo, el abajo firmante, declaro que mi estado de salud me permite realizar actividad física de alta intensidad..."
              style={{ fontFamily: 'inherit', lineHeight: 1.7 }}
            />
          </div>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginTop: 12 }}>{error}</div>}
      {exito && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--green-dim)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius)', color: 'var(--green)', fontSize: 13 }}>
          ✓ Políticas guardadas correctamente
        </div>
      )}
    </div>
  )
}
