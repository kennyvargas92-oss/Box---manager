// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// Permisos por rol — misma lógica que en el prototipo
const PERMISOS = {
  dueño:       ['dashboard','acceso','atletas','pagos','suscripciones','tienda',
                 'finanzas','rutinas','clase','progreso','metricas','configuracion','politicas'],
  colaborador: ['dashboard','acceso','atletas','pagos','tienda','rutinas','clase','progreso']
}

export function AuthProvider({ children }) {
  const [session,  setSession]  = useState(null)
  const [perfil,   setPerfil]   = useState(null)   // datos de usuarios_sistema
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    // Obtener sesión activa al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) cargarPerfil(session.user.id)
      else setLoading(false)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        if (session) await cargarPerfil(session.user.id)
        else { setPerfil(null); setLoading(false) }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function cargarPerfil(userId) {
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error cargando perfil:', error.message)
      // Si no tiene perfil en la tabla, asumir colaborador
      setPerfil({ id: userId, nombre: session?.user?.email, rol: 'colaborador', initiales: 'CO' })
    } else {
      setPerfil(data)
    }
    setLoading(false)
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { data }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setPerfil(null)
  }

  function puedeVer(page) {
    if (!perfil) return false
    return (PERMISOS[perfil.rol] || []).includes(page)
  }

  const esDueno      = perfil?.rol === 'dueño'
  const esColaborador = perfil?.rol === 'colaborador'

  return (
    <AuthContext.Provider value={{
      session, perfil, loading,
      signIn, signOut,
      puedeVer, esDueno, esColaborador
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
