import { X } from 'lucide-react'

export function StatCard({ label, value, sub, icon: Icon, tone = 'ink' }) {
  const toneMap = {
    ink: 'text-ink',
    brand: 'text-brand',
    success: 'text-success',
    danger: 'text-danger',
  }
  return (
    <div className="bg-white rounded-xl2 shadow-soft border border-border p-5 flex-1 min-w-[200px]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
        {Icon && <Icon size={18} className={toneMap[tone]} />}
      </div>
      <div className={`font-display text-2xl font-semibold mt-2 ${toneMap[tone]}`}>{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  )
}

export function Card({ title, action, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl2 shadow-soft border border-border p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-dark',
    secondary: 'bg-lavender text-ink hover:bg-border',
    ghost: 'text-muted hover:bg-lavender hover:text-ink',
    danger: 'bg-danger-light text-danger hover:bg-danger hover:text-white',
  }
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-5 py-3 text-sm' }
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Input({ label, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-semibold text-muted mb-1.5">{label}</span>}
      <input
        className={`w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand ${className}`}
        {...props}
      />
    </label>
  )
}

export function Select({ label, className = '', children, ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-semibold text-muted mb-1.5">{label}</span>}
      <select
        className={`w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div className={`bg-white rounded-xl2 shadow-card w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto scrollbar-thin`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white">
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink p-1 rounded-full hover:bg-lavender">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export function Badge({ children, tone = 'muted' }) {
  const tones = {
    muted: 'bg-lavender text-muted',
    success: 'bg-success-light text-success',
    danger: 'bg-danger-light text-danger',
    brand: 'bg-brand-light text-brand-dark',
    gold: 'bg-gold-light text-gold',
  }
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${tones[tone]}`}>{children}</span>
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && <Icon size={32} className="text-border mb-3" strokeWidth={1.5} />}
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {subtitle && <p className="text-sm text-muted mt-1 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
