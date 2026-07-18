import { useState } from 'react'
import { Download, History } from 'lucide-react'
import Layout from '../components/Layout'
import { Card, Button } from '../components/ui'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { formatDateTime } from '../lib/dates'
import { number } from '../lib/units'

function toCSV(rows, headers) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n')
}

function download(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function Settings() {
  const { user } = useAuth()
  const { sales, expenses, ingredients, stockMovements } = useData()

  const exportSales = () => {
    const rows = sales.map((s) => ({ fecha: formatDateTime(s.date), total: s.total, costo: s.totalCost, ganancia: s.profit, medio: s.paymentMethod, cliente: s.client }))
    download('rulo_ventas.csv', toCSV(rows, ['fecha', 'total', 'costo', 'ganancia', 'medio', 'cliente']))
  }
  const exportExpenses = () => {
    const rows = expenses.map((e) => ({ fecha: formatDateTime(e.date), categoria: e.category, descripcion: e.description, monto: e.amount }))
    download('rulo_gastos.csv', toCSV(rows, ['fecha', 'categoria', 'descripcion', 'monto']))
  }
  const exportIngredients = () => {
    const rows = ingredients.map((i) => ({ nombre: i.name, marca: i.brand || '', stock: i.currentStock, unidad: i.baseUnit, minimo: i.minStock, costo_compra: i.purchasePrice }))
    download('rulo_insumos.csv', toCSV(rows, ['nombre', 'marca', 'stock', 'unidad', 'minimo', 'costo_compra']))
  }

  return (
    <Layout title="Configuración" subtitle="Tu cuenta, exportación de datos e historial de movimientos de stock">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Cuenta">
          <p className="text-sm text-ink">Sesión iniciada como:</p>
          <p className="text-sm text-muted mb-4">{user?.email}</p>
          <p className="text-xs text-muted">
            Para agregar más usuarios (ej. un empleado), creá su login en Firebase Console → Authentication.
          </p>
        </Card>

        <Card title="Exportar datos (CSV)">
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={exportSales}><Download size={16} />Ventas</Button>
            <Button variant="secondary" onClick={exportExpenses}><Download size={16} />Gastos</Button>
            <Button variant="secondary" onClick={exportIngredients}><Download size={16} />Insumos y stock</Button>
          </div>
        </Card>
      </div>

      <Card title="Historial de movimientos de stock" className="mt-5" action={<History size={18} className="text-muted" />}>
        {stockMovements.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay movimientos.</p>
        ) : (
          <table className="data-table w-full">
            <thead><tr><th>Fecha</th><th>Insumo</th><th>Tipo</th><th>Cantidad</th><th>Nota</th></tr></thead>
            <tbody>
              {stockMovements.slice(0, 100).map((m) => (
                <tr key={m.id}>
                  <td>{formatDateTime(m.createdAt)}</td>
                  <td className="font-medium text-ink">{m.ingredientName}</td>
                  <td className="capitalize">{m.type}</td>
                  <td className={m.qtyBase >= 0 ? 'text-success' : 'text-danger'}>
                    {m.qtyBase >= 0 ? '+' : ''}{number(m.qtyBase)}
                  </td>
                  <td className="text-muted text-sm">{m.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Layout>
  )
}