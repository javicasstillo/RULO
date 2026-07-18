import { useMemo } from 'react'
import { TrendingUp, Wallet, ShoppingCart, AlertTriangle, Receipt, PiggyBank } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import Layout from '../components/Layout'
import { StatCard, Card, Badge, EmptyState } from '../components/ui'
import { useData } from '../context/DataContext'
import { toDate, isSameDay, isSameMonth, daysAgo, dayKey } from '../lib/dates'
import { money, number } from '../lib/units'

export default function Dashboard() {
  const { sales, expenses, ingredients, products, loading } = useData()

  const stats = useMemo(() => {
    const today = new Date()
    const salesToday = sales.filter((s) => isSameDay(toDate(s.date), today))
    const salesMonth = sales.filter((s) => isSameMonth(toDate(s.date), today))
    const expensesMonth = expenses.filter((e) => isSameMonth(toDate(e.date), today))

    const totalToday = salesToday.reduce((a, s) => a + (s.total || 0), 0)
    const totalMonthSales = salesMonth.reduce((a, s) => a + (s.total || 0), 0)
    const totalMonthCost = salesMonth.reduce((a, s) => a + (s.totalCost || 0), 0)
    const totalMonthExpenses = expensesMonth.reduce((a, e) => a + (Number(e.amount) || 0), 0)
    const grossProfit = totalMonthSales - totalMonthCost
    const netProfit = grossProfit - totalMonthExpenses

    return { totalToday, totalMonthSales, totalMonthExpenses, grossProfit, netProfit, salesTodayCount: salesToday.length }
  }, [sales, expenses])

  const chartData = useMemo(() => {
    const map = {}
    for (let i = 13; i >= 0; i--) {
      const d = daysAgo(i)
      map[dayKey(d)] = { date: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }), ventas: 0, gastos: 0 }
    }
    sales.forEach((s) => {
      const d = toDate(s.date)
      if (!d) return
      const k = dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate()))
      if (map[k]) map[k].ventas += s.total || 0
    })
    expenses.forEach((e) => {
      const d = toDate(e.date)
      if (!d) return
      const k = dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate()))
      if (map[k]) map[k].gastos += Number(e.amount) || 0
    })
    return Object.values(map)
  }, [sales, expenses])

  const lowStock = ingredients.filter((i) => (i.currentStock ?? 0) <= (i.minStock ?? 0))

  const topProducts = useMemo(() => {
    const counts = {}
    sales.forEach((s) => {
      (s.items || []).forEach((it) => {
        counts[it.productId] = (counts[it.productId] || 0) + it.qty
      })
    })
    return Object.entries(counts)
      .map(([id, qty]) => ({ product: products.find((p) => p.id === id), qty }))
      .filter((r) => r.product)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }, [sales, products])

  return (
    <Layout title="Panel" subtitle="Resumen general de RULO Picadas">
      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard label="Ventas de hoy" value={money(stats.totalToday)} sub={`${stats.salesTodayCount} venta(s)`} icon={ShoppingCart} tone="brand" />
        <StatCard label="Ventas del mes" value={money(stats.totalMonthSales)} icon={TrendingUp} tone="ink" />
        <StatCard label="Gastos del mes" value={money(stats.totalMonthExpenses)} icon={Receipt} tone="danger" />
        <StatCard label="Ganancia bruta" value={money(stats.grossProfit)} sub="Ventas − costo de insumos" icon={PiggyBank} tone="success" />
        <StatCard label="Ganancia neta" value={money(stats.netProfit)} sub="Ganancia bruta − gastos" icon={Wallet} tone={stats.netProfit >= 0 ? 'success' : 'danger'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Ventas y gastos · últimos 14 días" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="ventasGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F2410E" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#F2410E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gastosGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E23B3B" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#E23B3B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1DEF4" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B6480' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B6480' }} axisLine={false} tickLine={false} width={70}
                     tickFormatter={(v) => money(v)} />
              <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, borderColor: '#E1DEF4', fontSize: 13 }} />
              <Area type="monotone" dataKey="ventas" stroke="#F2410E" fill="url(#ventasGrad)" strokeWidth={2} name="Ventas" />
              <Area type="monotone" dataKey="gastos" stroke="#E23B3B" fill="url(#gastosGrad)" strokeWidth={2} name="Gastos" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Alertas de stock" action={lowStock.length > 0 && <Badge tone="danger">{lowStock.length}</Badge>}>
          {lowStock.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="Todo en orden" subtitle="Ningún insumo está por debajo del mínimo." />
          ) : (
            <ul className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin">
              {lowStock.map((i) => (
                <li key={i.id} className="flex items-center justify-between text-sm border-b border-border/60 pb-2">
                  <div>
                    <p className="font-medium text-ink">{i.name}</p>
                    <p className="text-xs text-muted">Mínimo: {number(i.minStock)} {i.baseUnit}</p>
                  </div>
                  <Badge tone="danger">{number(i.currentStock)} {i.baseUnit}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-5">
        <Card title="Productos más vendidos">
          {topProducts.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="Todavía no hay ventas" subtitle="Cuando registres ventas, vas a ver acá el ranking." />
          ) : (
            <table className="data-table w-full">
              <thead><tr><th>Producto</th><th>Unidades vendidas</th><th>Precio actual</th></tr></thead>
              <tbody>
                {topProducts.map(({ product, qty }) => (
                  <tr key={product.id}>
                    <td className="font-medium text-ink">{product.name}</td>
                    <td>{qty}</td>
                    <td>{money(product.sellPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </Layout>
  )
}
