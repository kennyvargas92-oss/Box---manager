// src/components/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const NAV = [
  { page: 'dashboard',     icon: '◈', label: 'Dashboard' },
  { page: 'acceso',        icon: '◉', label: 'Control de acceso' },
  { page: 'atletas',       icon: '◎', label: 'Atletas' },
  { page: 'pagos',         icon: '◇', label: 'Mensualidades' },
  { page: 'suscripciones', icon: '◈', label: 'Suscripciones' },
  { page: 'rutinas',       icon: '◆', label: 'Rutinas / WOD' },
  { page: 'clase',         icon: '▶', label: 'Clase en vivo' },
  { page: 'progreso',      icon: '△', label: 'Progreso atletas' },
  { page: 'tienda',        icon: '◫', label: 'Tienda' },
  { page: 'finanzas',      icon: '◐', label: 'Finanzas BOX' },
  { page: 'configuracion', icon: '⚙', label: 'Configuración BOX' },
  { page: 'politicas',     icon: '▤', label: 'Políticas y docs.' },
  { page: 'metricas',      icon: '▣', label: 'Métricas' },
]

export default function Layout() {
  const { perfil, signOut, puedeVer } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  const initiales = perfil?.initiales || perfil?.nombre?.slice(0,2).toUpperCase() || 'U'

  return (
    <div className="app-layout">

      {/* OVERLAY para móvil */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="brand-icon">⬡</span>
          <span className="brand-name-sm">BOX<b>MGR</b></span>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <nav className="sidebar-nav">
          {NAV.filter(n => puedeVer(n.page)).map(n => (
            <NavLink
              key={n.page}
              to={`/${n.page}`}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initiales}</div>
            <div className="user-data">
              <span className="user-name">{perfil?.nombre || 'Usuario'}</span>
              <span className="user-role">{perfil?.rol === 'dueño' ? 'Propietario' : 'Colaborador'}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Salir</button>
        </div>

        <div className="sidebar-author">
          Desarrollado por<br/>
          <strong>Kenny Vianey Vargas Segura</strong><br/>
          Adm. Empresas · Máster PM · Business Analytics
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="topbar-title" id="topbar-title">BOX Manager</div>
          <div className="topbar-right">
            <div className="topbar-date">{new Date().toLocaleDateString('es-CO',{weekday:'short',day:'numeric',month:'short'})}</div>
            <div className={`rol-badge ${perfil?.rol === 'dueño' ? 'rol-dueno' : 'rol-colab'}`}>
              {perfil?.rol === 'dueño' ? 'Propietario' : 'Colaborador'}
            </div>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
