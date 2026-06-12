// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Acceso from './pages/Acceso'
import Atletas from './pages/Atletas'
import Pagos from './pages/Pagos'
import Suscripciones from './pages/Suscripciones'
import Rutinas from './pages/Rutinas'
import Progreso from './pages/Progreso'
import Tienda from './pages/Tienda'
import Finanzas from './pages/Finanzas'
import Metricas from './pages/Metricas'
import Configuracion from './pages/Configuracion'
import Politicas from './pages/Politicas'
import AccesoRestringido from './pages/AccesoRestringido'
import ClaseEnVivo from './pages/ClaseEnVivo'

// Guarda de autenticación
function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>
  if (!session) return <Navigate to="/login" replace />
  return children
}

// Guarda de rol
function RequireRol({ page, children }) {
  const { puedeVer } = useAuth()
  if (!puedeVer(page)) return <AccesoRestringido />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"     element={<Dashboard />} />
            <Route path="acceso"        element={<RequireRol page="acceso"><Acceso /></RequireRol>} />
            <Route path="atletas"       element={<RequireRol page="atletas"><Atletas /></RequireRol>} />
            <Route path="pagos"         element={<RequireRol page="pagos"><Pagos /></RequireRol>} />
            <Route path="suscripciones" element={<RequireRol page="suscripciones"><Suscripciones /></RequireRol>} />
            <Route path="rutinas"       element={<RequireRol page="rutinas"><Rutinas /></RequireRol>} />
            <Route path="clase"         element={<RequireRol page="clase"><ClaseEnVivo /></RequireRol>} />
            <Route path="progreso"      element={<RequireRol page="progreso"><Progreso /></RequireRol>} />
            <Route path="tienda"        element={<RequireRol page="tienda"><Tienda /></RequireRol>} />
            <Route path="finanzas"      element={<RequireRol page="finanzas"><Finanzas /></RequireRol>} />
            <Route path="metricas"      element={<RequireRol page="metricas"><Metricas /></RequireRol>} />
            <Route path="configuracion" element={<RequireRol page="configuracion"><Configuracion /></RequireRol>} />
            <Route path="politicas"     element={<RequireRol page="politicas"><Politicas /></RequireRol>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
