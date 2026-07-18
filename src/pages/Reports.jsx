import { useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import Layout from '../components/Layout'
import { Card, Badge } from '../components/ui'
import { useData } from '../context/DataContext'
import { productCost, marginPercent, money, number } from '../lib/units'
import { toDate, isSameMonth } from '../lib/dates'

const PIE_COLORS = ['#F2410E', '#D89A3E', '#1F9D6C', '#6B6480', '#E23B3B', '#241C3D', '#C7330A']

export default function Reports() {
  const { products, ingredientsById, sales, expenses } = useData()

  const marginRanking = useMemo(() => {
    return products
      .map((p) => {
        const cost = productCost(p.recipe, ingredientsById)
        return { name: p.name, cost, price: p.sellPrice, margin: marginPercent(p.sellPrice, cost) }
      })
      .sort((a, b) => b.margin - a.margin)
  }, [products, ingredientsById])

  const expenseByCategory = useMemo(() => {
    const map = {}
    expenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + (Number(e.amount) || 0) })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [expenses])

  const salesByProduct = useMemo(() => {
    const map = {}
    sales.forEach((s) => (s.items || []).forEach((it) => {
      map[it.productId] = (map[it.productId] || 0) + it.unitPrice * it.qty
    }))
    return Object.entries(map)
      .map(([id, total]) => ({ name: products.find((p) => p.id === id)?.name || 'Producto eliminado', total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }, [sales, products])

  const monthComparison = useMemo(() => {
    const now = new Date()
    const thisMonthSales = sales.filter((s) => isSameMonth(toDate(s.date), now)).reduce((a, s) => a + s.total, 0)
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthSales = sales.filter((s) => isSameMonth(toDate(s.date), lastMonthDate)).reduce((a, s) => a + s.total, 0)
    const diff = lastMonthSales === 0 ? null : ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100
    return { thisMonthSales, lastMonthSales, diff }
  }, [sales])

  return (
    <Layout title="Reportes" subtitle="Rentabilidad por producto, gastos por categoría y evolución de ventas">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title="Ranking de rentabilidad por picada">
          {marginRanking.length === 0 ? (
            <p className="text-sm text-muted">Cargá productos para ver este reporte.</p>
          ) : (
            <table className="data-table w-full">
              <thead><tr><th>Picada</th><th>Costo</th><th>Precio</th><th>Margen</th></tr></thead>
              <tbody>
                {marginRanking.map((r) => (
                  <tr key={r.name}>
                    <td className="font-medium text-ink">{r.name}</td>
                    <td>{money(r.cost)}</td>
                    <td>{money(r.price)}</td>
                    <td><Badge tone={r.margin >= 40 ? 'success' : r.margin >= 15 ? 'gold' : 'danger'}>{number(r.margin, 1)}%</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Gastos por categoría">
          {expenseByCategory.length === 0 ? (
            <p className="text-sm text-muted">No hay gastos cargados todavía.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={(e) => `${e.name}`}>
                  {expenseByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => money(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card title="Facturación por producto (histórico)" className="mb-5">
        {salesByProduct.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay ventas registradas.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={salesByProduct} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1DEF4" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6B6480' }} tickFormatter={(v) => money(v)} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fill: '#241C3D' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, borderColor: '#E1DEF4', fontSize: 13 }} />
              <Bar dataKey="total" fill="#F2410E" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Comparativa mensual de ventas">
        <div className="flex gap-6 items-center">
          <div>
            <div className="text-xs text-muted font-semibold">Este mes</div>
            <div className="font-display text-2xl font-semibold text-ink">{money(monthComparison.thisMonthSales)}</div>
          </div>
          <div>
            <div className="text-xs text-muted font-semibold">Mes anterior</div>
            <div className="font-display text-2xl font-semibold text-muted">{money(monthComparison.lastMonthSales)}</div>
          </div>
          {monthComparison.diff !== null && (
            <Badge tone={monthComparison.diff >= 0 ? 'success' : 'danger'}>
              {monthComparison.diff >= 0 ? '+' : ''}{number(monthComparison.diff, 1)}% vs mes anterior
            </Badge>
          )}
        </div>
      </Card>
    </Layout>
  )
}
