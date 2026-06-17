// src/pages/Tienda.jsx
import { useState } from 'react'
import { useProductos, useVentas, useDeudores, useAtletas, registrarVenta, crearProducto } from '../hooks/useData'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const CATEGORIAS = ['Suplemento', 'Ropa', 'Accesorio', 'Bebida', 'Otro']
const METODOS    = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata', 'Otro']

export default function Tienda() {
  const { data: productos, loading, refetch: refetchProductos } = useProductos()
  const { data: ventas,    refetch: refetchVentas }             = useVentas()
  const { data: deudores,  refetch: refetchDeudores }           = useDeudores()
  const { data: atletas }                                        = useAtletas()
  const { esDueno }                                              = useAuth()
  const [tab,           setTab]           = useState('inventario') // inventario | ventas | fiado
  const [modalVenta,    setModalVenta]    = useState(false)
  const [modalProducto, setModalProducto] = useState(false)

  if (loading) return <div className="empty-state"><div className="spinner" /></div>

  const totalDeuda = (deudores || []).reduce((s, d) => s + Number(d.total), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Tienda</div>
          <div className="page-sub">{productos?.length || 0} productos · Fiado: ${totalDeuda.toLocaleString('es-CO')}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {esDueno && <button className="btn" onClick={() => setModalProducto(true)}>+ Producto</button>}
          <button className="btn btn-accent" onClick={() => setModalVenta(true)}>+ Venta</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[['inventario','Inventario'],['ventas','Ventas del mes'],['fiado','Fiado']].map(([val, lbl]) => (
          <button key={val} onClick={() => setTab(val)} style={{
            background: 'none', border: 'none', color: tab === val ? 'var(--accent)' : 'var(--text3)',
            fontWeight: tab === val ? 700 : 400, fontSize: 13, padding: '10px 16px', cursor: 'pointer',
            borderBottom: tab === val ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1
          }}>{lbl}</button>
        ))}
      </div>

      {tab === 'inventario' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Costo</th><th>Stock</th><th>Estado</th></tr></thead>
              <tbody>
                {(productos || []).map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                    <td><span className="badge badge-gray">{p.categoria}</span></td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>${Number(p.precio).toLocaleString('es-CO')}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{p.costo ? `$${Number(p.costo).toLocaleString('es-CO')}` : '—'}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: p.stock <= (p.stock_min || 3) ? 'var(--red)' : 'var(--text)' }}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      {p.stock === 0
                        ? <span className="badge badge-red">Agotado</span>
                        : p.stock <= (p.stock_min || 3)
                        ? <span className="badge badge-yellow">Stock bajo</span>
                        : <span className="badge badge-green">Disponible</span>}
                    </td>
                  </tr>
                ))}
                {(!productos || productos.length === 0) && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>Sin productos registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'ventas' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Producto</th><th>Cliente</th><th>Cantidad</th><th>Total</th><th>Método</th><th>Fecha</th></tr></thead>
              <tbody>
                {(ventas || []).map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 500 }}>{v.productos?.nombre || '—'}</td>
                    <td style={{ fontSize: 12 }}>{v.atletas?.nombre || v.cc_cliente || 'Externo'}</td>
                    <td style={{ textAlign: 'center' }}>{v.cantidad}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>${Number(v.total).toLocaleString('es-CO')}</td>
                    <td><span className="badge badge-gray">{v.metodo}</span></td>
                    <td style={{ fontSize: 12 }}>{v.created_at ? new Date(v.created_at).toLocaleDateString('es-CO') : '—'}</td>
                  </tr>
                ))}
                {(!ventas || ventas.length === 0) && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>Sin ventas este mes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'fiado' && (
        <>
          <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--red)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Total en fiado pendiente</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--red)' }}>
              ${totalDeuda.toLocaleString('es-CO')}
            </div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Atleta</th><th>Producto</th><th>Total</th><th>Fecha</th><th></th></tr></thead>
                <tbody>
                  {(deudores || []).map(d => (
                    <tr key={d.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{d.atletas?.nombre || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{d.atletas?.cc}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{d.productos?.nombre || '—'}</td>
                      <td style={{ color: 'var(--red)', fontWeight: 600 }}>${Number(d.total).toLocaleString('es-CO')}</td>
                      <td style={{ fontSize: 12 }}>{d.created_at ? new Date(d.created_at).toLocaleDateString('es-CO') : '—'}</td>
                      <td>
                        <button className="btn btn-sm btn-success" onClick={async () => {
                          await supabase.from('ventas').update({ fiado_pagado: true, fecha_pago_fiado: new Date().toISOString().split('T')[0] }).eq('id', d.id)
                          refetchDeudores()
                        }}>Cobrar</button>
                      </td>
                    </tr>
                  ))}
                  {(!deudores || deudores.length === 0) && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>Sin deudas pendientes</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {modalVenta && (
        <ModalVenta
          productos={productos || []}
          atletas={atletas || []}
          onClose={() => setModalVenta(false)}
          onSaved={() => { setModalVenta(false); refetchVentas(); refetchProductos() }}
        />
      )}

      {modalProducto && (
        <ModalProducto
          onClose={() => setModalProducto(false)}
          onSaved={() => { setModalProducto(false); refetchProductos() }}
        />
      )}
    </div>
  )
}

function ModalVenta({ productos, atletas, onClose, onSaved }) {
  const [productoId, setProductoId] = useState('')
  const [cantidad,   setCantidad]   = useState(1)
  const [clienteId,  setClienteId]  = useState('')
  const [ccExterno,  setCcExterno]  = useState('')
  const [metodo,     setMetodo]     = useState('Efectivo')
  const [esFiado,    setEsFiado]    = useState(false)
  const [error,      setError]      = useState('')
  const [guardando,  setGuardando]  = useState(false)

  const producto  = productos.find(p => p.id === productoId)
  const subtotal  = producto ? Number(producto.precio) * Number(cantidad) : 0
  const margen    = producto?.costo ? Math.round(((producto.precio - producto.costo) / producto.precio) * 100) : null

  async function handleGuardar() {
    if (!productoId)          { setError('Selecciona un producto'); return }
    if (cantidad < 1)         { setError('La cantidad debe ser mayor a 0'); return }
    if (producto && cantidad > producto.stock) { setError(`Solo hay ${producto.stock} en stock`); return }

    setGuardando(true); setError('')

    // Descontar stock manualmente (sin RPC)
    const { error: errStock } = await supabase
      .from('productos')
      .update({ stock: producto.stock - Number(cantidad) })
      .eq('id', productoId)

    if (errStock) { setError(errStock.message); setGuardando(false); return }

    const { error } = await registrarVenta({
      producto_id: productoId,
      cantidad:    Number(cantidad),
      total:       subtotal,
      atleta_id:   clienteId || null,
      cc_cliente:  ccExterno || null,
      metodo,
      es_fiado:    esFiado,
      fiado_pagado: false,
    })

    if (error) { setError(error); setGuardando(false); return }
    onSaved()
  }

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Registrar venta</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Producto *</label>
            <select value={productoId} onChange={e => setProductoId(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {productos.filter(p => p.stock > 0).map(p => (
                <option key={p.id} value={p.id}>{p.nombre} — ${Number(p.precio).toLocaleString('es-CO')} (stock: {p.stock})</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cantidad</label>
              <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} min="1" max={producto?.stock || 99} />
            </div>
            <div className="form-group">
              <label>Método de pago</label>
              <select value={metodo} onChange={e => setMetodo(e.target.value)}>
                {METODOS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Cliente (atleta del BOX)</label>
            <select value={clienteId} onChange={e => setClienteId(e.target.value)}>
              <option value="">— Cliente externo —</option>
              {atletas.filter(a => a.activo).map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>

          {!clienteId && (
            <div className="form-group">
              <label>CC cliente externo</label>
              <input type="text" value={ccExterno} onChange={e => setCcExterno(e.target.value)} placeholder="Opcional" />
            </div>
          )}

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}>
              <input type="checkbox" checked={esFiado} onChange={e => setEsFiado(e.target.checked)} style={{ width: 'auto' }} />
              Venta a crédito (fiado)
            </label>
          </div>

          {producto && (
            <div style={{ background: 'var(--dark3)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text2)' }}>Total</span>
                <span style={{ fontWeight: 700, color: 'var(--green)' }}>${subtotal.toLocaleString('es-CO')}</span>
              </div>
              {margen !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ color: 'var(--text3)', fontSize: 11 }}>Margen de ganancia</span>
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>{margen}%</span>
                </div>
              )}
            </div>
          )}

          {error && <div className="alert-error" style={{ marginTop: 12 }}>{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleGuardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Registrar venta'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalProducto({ onClose, onSaved }) {
  const [form, setForm] = useState({ nombre: '', categoria: 'Suplemento', precio: '', costo: '', stock: '', stock_min: 3 })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }

  async function handleGuardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!form.precio)        { setError('El precio es obligatorio'); return }
    if (!form.stock && form.stock !== 0) { setError('El stock es obligatorio'); return }
    setGuardando(true); setError('')
    const { error } = await crearProducto({
      nombre: form.nombre, categoria: form.categoria,
      precio: Number(form.precio), costo: form.costo ? Number(form.costo) : null,
      stock: Number(form.stock), stock_min: Number(form.stock_min) || 3,
    })
    if (error) { setError(error); setGuardando(false); return }
    onSaved()
  }

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Nuevo producto</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Nombre *</label>
              <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre del producto" />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Precio de venta *</label>
              <input type="number" value={form.precio} onChange={e => set('precio', e.target.value)} min="0" placeholder="$" />
            </div>
            <div className="form-group">
              <label>Costo (opcional)</label>
              <input type="number" value={form.costo} onChange={e => set('costo', e.target.value)} min="0" placeholder="$" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Stock inicial *</label>
              <input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} min="0" />
            </div>
            <div className="form-group">
              <label>Alerta de stock mínimo</label>
              <input type="number" value={form.stock_min} onChange={e => set('stock_min', e.target.value)} min="0" />
            </div>
          </div>
          {form.precio && form.costo && (
            <div style={{ background: 'var(--dark3)', borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: 12, color: 'var(--text2)' }}>
              Margen: {Math.round(((form.precio - form.costo) / form.precio) * 100)}% — Ganancia por unidad: ${(form.precio - form.costo).toLocaleString('es-CO')}
            </div>
          )}
          {error && <div className="alert-error" style={{ marginTop: 12 }}>{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleGuardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Crear producto'}
          </button>
        </div>
      </div>
    </div>
  )
}
