// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { signIn, session } = useAuth()
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  // Si ya hay sesión activa, ir al dashboard
  if (session) { navigate('/dashboard'); return null }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError('Completa todos los campos'); return }
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-overlay" />
        <div className="login-shapes">
          <div className="shape s1" />
          <div className="shape s2" />
        </div>
      </div>

      <div className="login-container">
        <div className="login-brand">
          <span className="brand-icon">⬡</span>
          <h1 className="brand-name">BOX<span>MGR</span></h1>
          <p className="brand-tagline">Sistema de gestión CrossFit</p>
        </div>

        <div className="login-card">
          <h2>Iniciar sesión</h2>
          <p className="login-sub">Accede al panel de administración</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="admin@mibox.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <div className="input-with-icon">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && <div className="alert-error">{error}</div>}

            <button type="submit" className="btn-main" disabled={loading}>
              {loading ? 'Ingresando...' : 'Entrar al sistema'}
            </button>
          </form>

          <div className="login-hint">
            <p>Usa las credenciales que el administrador te proporcionó.</p>
            <p style={{ marginTop: '6px', fontSize: '11px' }}>
              Si es la primera vez, revisa tu correo para activar tu cuenta.
            </p>
          </div>
        </div>

        <div className="login-author">
          Desarrollado por <strong>Kenny Vianey Vargas Segura</strong><br/>
          Administradora de Empresas · Máster en Project Management<br/>
          con Mención en Business Analytics
        </div>
      </div>
    </div>
  )
}
