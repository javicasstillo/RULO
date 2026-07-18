import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Ingredients from './pages/Ingredients'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Expenses from './pages/Expenses'
import CashFlow from './pages/CashFlow'
import Reports from './pages/Reports'
import Clients from './pages/Clients'
import Settings from './pages/Settings'

function Private({ children }) {
  const { user } = useAuth()
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <span className="text-muted text-sm">Cargando…</span>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Private><Dashboard /></Private>} />
      <Route path="/insumos" element={<Private><Ingredients /></Private>} />
      <Route path="/productos" element={<Private><Products /></Private>} />
      <Route path="/ventas" element={<Private><Sales /></Private>} />
      <Route path="/gastos" element={<Private><Expenses /></Private>} />
      <Route path="/caja" element={<Private><CashFlow /></Private>} />
      <Route path="/reportes" element={<Private><Reports /></Private>} />
      <Route path="/clientes" element={<Private><Clients /></Private>} />
      <Route path="/configuracion" element={<Private><Settings /></Private>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
