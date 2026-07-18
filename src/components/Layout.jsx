import Sidebar from './Sidebar'

export default function Layout({ title, subtitle, action, children }) {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <header className="flex items-center justify-between px-8 py-6 border-b border-border bg-white/60 backdrop-blur sticky top-0 z-10">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
            {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </header>
        <div className="p-8 max-w-[1400px]">{children}</div>
      </main>
    </div>
  )
}
