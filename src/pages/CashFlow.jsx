import { useMemo, useState } from 'react'
import { Plus, Trash2, Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { Card, Button, Input, Select, Modal, Badge, EmptyState, StatCard } from '../components/ui'
import { useData } from '../context/DataContext'
import { addCashMovement, deleteCashMovement } from '../lib/firestore'
import { money } from '../lib/units'
import { formatDateTime, toDate } from '../lib/dates'

// Unifica ventas + gastos + movimientos manuales en un solo libro de caja
export default function CashFlow() {
  const { sales, expenses, cashMovements } = useData()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ type: 'ingreso', category: '', description: '', amount: '' })

  const ledger = useMemo(() => {
    const rows = [
      ...sales.map((s) => ({ id: 's-' + s.id, date: s.date, type: 'ingreso', category: 'Venta', description: `Venta #${s.id.slice(0, 6)}`, amount: s.total, source: 'venta' })),
      ...expenses.map((e) => ({ id: 'e-' + e.id, date: e.date, type: 'egreso', category: e.category, description: e.description, amount: e.amount, source: 'gasto' })),
      ...cashMovements.map((c) => ({ id: 'c-' + c.id, date: c.date, type: c.type, category: c.category, description: c.description, amount: c.amount, source: 'manual', originalId: c.id })),
    ]
    return rows.sort((a, b) => (toDate(b.date)?.getTime() || 0) - (toDate(a.date)?.getTime() || 0))
  }, [sales, expenses, cashMovements])

  const totals = useMemo(() => {
    const ingresos = ledger.filter((r) => r.type === 'ingreso').reduce((a, r) => a + (r.amount || 0), 0)
    const egresos = ledger.filter((r) => r.type === 'egreso').reduce((a, r) => a + (r.amount || 0), 0)
    return { ingresos, egresos, saldo: ingresos - egresos }
  }, [ledger])

  const submit = async (e) => {
    e.preventDefault()
    await addCashMovement({ ...form, amount: Number(form.amount) })
    setForm({ type: 'ingreso', category: '', description: '', amount: '' })
    setModal(false)
  }

  return (
    <Layout title="Ingresos y egresos" subtitle="Libro de caja: ventas, gastos y movimientos manuales en un solo lugar"
      action={<Button onClick={() => setModal(true)}><Plus size={16} />Movimiento manual</Button>}>
      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard label="Ingresos totales" value={money(totals.ingresos)} icon={ArrowUpCircle} tone="success" />
        <StatCard label="Egresos totales" value={money(totals.egresos)} icon={ArrowDownCircle} tone="danger" />
        <StatCard label="Saldo" value={money(totals.saldo)} icon={Wallet} tone={totals.saldo >= 0 ? 'success' : 'danger'} />
      </div>

      <Card>
        {ledger.length === 0 ? (
          <EmptyState icon={Wallet} title="Sin movimientos todavía" subtitle="Las ventas y gastos aparecen automáticamente. También podés cargar movimientos manuales (retiros, aportes, etc.)." />
        ) : (
          <table className="data-table w-full">
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Monto</th><th></th></tr></thead>
            <tbody>
              {ledger.map((r) => (
                <tr key={r.id}>
                  <td>{formatDateTime(r.date)}</td>
                  <td>{r.type === 'ingreso' ? <Badge tone="success">Ingreso</Badge> : <Badge tone="danger">Egreso</Badge>}</td>
                  <td>{r.category}</td>
                  <td>{r.description}</td>
                  <td className={`font-semibold ${r.type === 'ingreso' ? 'text-success' : 'text-danger'}`}>
                    {r.type === 'ingreso' ? '+' : '−'} {money(r.amount)}
                  </td>
                  <td>
                    {r.source === 'manual' && (
                      <button onClick={() => deleteCashMovement(r.originalId)} className="p-1.5 rounded-md hover:bg-danger-light text-muted hover:text-danger"><Trash2 size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo movimiento manual">
        <form onSubmit={submit} className="space-y-4">
          <Select label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </Select>
          <Input label="Categoría" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Aporte de capital / Retiro socio" />
          <Input label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Monto ($)" type="number" step="any" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Button type="submit" className="w-full justify-center">Guardar movimiento</Button>
        </form>
      </Modal>
    </Layout>
  )
}
