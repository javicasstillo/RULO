import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Wheat, UtensilsCrossed, ShoppingCart, Receipt,
  Wallet, BarChart3, Users, Settings, LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/insumos', label: 'Insumos y stock', icon: Wheat },
  { to: '/productos', label: 'Picadas (recetas)', icon: UtensilsCrossed },
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { to: '/gastos', label: 'Gastos', icon: Receipt },
  { to: '/caja', label: 'Ingresos y egresos', icon: Wallet },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
]

export default function Sidebar() {
  const { logout } = useAuth()
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-border flex flex-col">
      <div className="px-6 pt-7 pb-5">
        <div className="inline-block text-brand brush-underline">
          <span className="font-display italic font-semibold text-3xl tracking-tight">RULO</span>
        </div>
        <div className="text-[11px] tracking-[0.2em] text-muted font-semibold mt-2 uppercase">
          Picadas · Gestión
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-light text-brand-dark'
                  : 'text-ink/70 hover:bg-lavender hover:text-ink'
              }`
            }
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:bg-lavender hover:text-ink w-full transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
