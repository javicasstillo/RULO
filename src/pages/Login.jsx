import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button, Input } from '../components/ui'

export default function Login() {
  const { login, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await login(email, password)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block text-brand brush-underline">
            <span className="font-display italic font-semibold text-5xl tracking-tight">RULO</span>
          </div>
          <div className="text-xs tracking-[0.25em] text-muted font-semibold mt-3 uppercase">
            Picadas · Gestión
          </div>
        </div>
        <form onSubmit={onSubmit} className="bg-white rounded-xl2 shadow-card border border-border p-6 space-y-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@rulopicadas.com" />
          <Input label="Contraseña" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full justify-center" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
        <p className="text-xs text-muted text-center mt-4">
          Creá tu usuario desde Firebase Console → Authentication → Email/Password.
        </p>
      </div>
    </div>
  )
}
