import { useMemo, useState } from 'react'
import { Plus, Trash2, Receipt } from 'lucide-react'
import Layout from '../components/Layout'
import { Card, Button, Input, Select, Modal, Badge, EmptyState, StatCard } from '../components/ui'
import { useData } from '../context/DataContext'
import { addExpense, deleteExpense } from '../lib/firestore'
import { money } from '../lib/units'
import { formatDate, toDate, isSameMonth } from '../lib/dates'

const CATEGORIES = ['Insumos', 'Packaging', 'Delivery', 'Alquiler', 'Servicios', 'Marketing', 'Sueldos', 'Otros']

export default function Expenses() {
  const { expenses } = useData()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ category: 'Insumos', description: '', amount: '', paymentMethod: 'Efectivo' })

  const monthTotal = useMemo(() => {
    const today = new Date()
    return expenses.filter((e) => isSameMonth(toDate(e.date), today)).reduce((a, e) => a + (Number(e.amount) || 0), 0)
  }, [expenses])

  const byCategory = useMemo(() => {
    const map = {}
    expenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + (Number(e.amount) || 0) })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [expenses])

  const submit = async (e) => {
    e.preventDefault()
    await addExpense({ ...form, amount: Number(form.amount) })
    setForm({ category: 'Insumos', description: '', amount: '', paymentMethod: 'Efectivo' })
    setModal(false)
  }

  return (
    <Layout title="Gastos" subtitle="Todo lo que sale de tu bolsillo para producir y operar"
      action={<Button onClick={() => setModal(true)}><Plus size={16} />Nuevo gasto</Button>}>
      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard label="Gastos del mes" value={money(monthTotal)} tone="danger" icon={Receipt} />
        {byCategory.slice(0, 3).map(([cat, amt]) => (
          <StatCard key={cat} label={cat} value={money(amt)} tone="ink" />
        ))}
      </div>

      <Card>
        {expenses.length === 0 ? (
          <EmptyState icon={Receipt} title="No hay gastos cargados" subtitle="Las compras de insumos se registran solas acá; sumá el resto manualmente." action={<Button onClick={() => setModal(true)}><Plus size={16} />Nuevo gasto</Button>} />
        ) : (
          <table className="data-table w-full">
            <thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Medio</th><th>Monto</th><th></th></tr></thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td>{formatDate(e.date)}</td>
                  <td><Badge tone={e.category === 'Insumos' ? 'brand' : 'muted'}>{e.category}</Badge></td>
                  <td>{e.description}{e.auto && <span className="text-xs text-muted ml-1">(auto)</span>}</td>
                  <td>{e.paymentMethod}</td>
                  <td className="font-semibold text-danger">{money(e.amount)}</td>
                  <td><button onClick={() => deleteExpense(e.id)} className="p-1.5 rounded-md hover:bg-danger-light text-muted hover:text-danger"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo gasto">
        <form onSubmit={submit} className="space-y-4">
          <Select label="Categoría" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Input label="Descripción" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Bolsas de packaging x100" />
          <Input label="Monto ($)" type="number" step="any" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Select label="Medio de pago" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
            {['Efectivo', 'Transferencia', 'Débito', 'Crédito'].map((m) => <option key={m}>{m}</option>)}
          </Select>
          <Button type="submit" className="w-full justify-center">Guardar gasto</Button>
        </form>
      </Modal>
    </Layout>
  )
}
