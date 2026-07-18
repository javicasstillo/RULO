import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = cargando, null = sin sesión
  const [error, setError] = useState('')

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u))
  }, [])

  const login = async (email, password) => {
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (e) {
      setError('Email o contraseña incorrectos.')
    }
  }

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
