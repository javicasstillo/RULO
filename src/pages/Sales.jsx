import { useMemo, useState } from 'react'
import { Plus, X, Trash2, ShoppingCart } from 'lucide-react'
import Layout from '../components/Layout'
import { Card, Button, Input, Select, Modal, Badge, EmptyState } from '../components/ui'
import { useData } from '../context/DataContext'
import { registerSale, deleteSale } from '../lib/firestore'
import { money, number } from '../lib/units'
import { formatDateTime } from '../lib/dates'

const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Débito', 'Crédito', 'Mercado Pago']

export default function Sales() {
  const { sales, products, ingredients } = useData()
  const [modal, setModal] = useState(false)
  const [items, setItems] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('Efectivo')
  const [client, setClient] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const total = useMemo(() => items.reduce((a, it) => a + (it.unitPrice * it.qty || 0), 0), [items])

  const openNew = () => { setItems([]); setPaymentMethod('Efectivo'); setClient(''); setNotes(''); setModal(true) }
  const addLine = () => {
    const p = products[0]
    if (!p) return
    setItems([...items, { productId: p.id, qty: 1, unitPrice: p.sellPrice }])
  }
  const updateLine = (idx, patch) => {
    const next = [...items]
    next[idx] = { ...next[idx], ...patch }
    setItems(next)
  }
  const removeLine = (idx) => setItems(items.filter((_, i) => i !== idx))

  const submit = async (e) => {
    e.preventDefault()
    if (items.length === 0) return
    setSaving(true)
    try {
      await registerSale({ items, paymentMethod, client, notes, products, ingredients })
      setModal(false)
    } catch (err) {
      alert('Error al registrar la venta: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout title="Ventas" subtitle="Cada venta descuenta stock automáticamente y calcula la ganancia"
      action={<Button onClick={openNew}><Plus size={16} />Nueva venta</Button>}>
      <Card>
        {sales.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Todavía no hay ventas registradas" subtitle="Registrá tu primera venta para empezar a ver ganancias y stock actualizado." action={<Button onClick={openNew}><Plus size={16} />Nueva venta</Button>} />
        ) : (
          <table className="data-table w-full">
            <thead><tr><th>Fecha</th><th>Items</th><th>Medio de pago</th><th>Cliente</th><th>Total</th><th>Ganancia</th><th></th></tr></thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td>{formatDateTime(s.date)}</td>
                  <td className="text-xs text-muted max-w-[220px]">
                    {(s.items || []).map((it, i) => {
                      const p = products.find((pp) => pp.id === it.productId)
                      return <div key={i}>{it.qty}× {p?.name || 'Producto eliminado'}</div>
                    })}
                  </td>
                  <td><Badge>{s.paymentMethod}</Badge></td>
                  <td>{s.client || '—'}</td>
                  <td className="font-semibold">{money(s.total)}</td>
                  <td className="text-success font-medium">{money(s.profit)}</td>
                  <td>
                    <button onClick={() => confirm('¿Eliminar esta venta? (No repone el stock automáticamente)') && deleteSale(s.id)} className="p-1.5 rounded-md hover:bg-danger-light text-muted hover:text-danger"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva venta" wide>
        <form onSubmit={submit} className="space-y-4">
          {products.length === 0 ? (
            <p className="text-sm text-muted">Primero armá al menos una picada en "Productos".</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Productos vendidos</span>
                <Button type="button" size="sm" variant="secondary" onClick={addLine}><Plus size={14} />Agregar producto</Button>
              </div>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="flex gap-2 items-end bg-lavender/60 rounded-lg p-2.5">
                    <Select className="flex-1" value={it.productId} onChange={(e) => {
                      const p = products.find((pp) => pp.id === e.target.value)
                      updateLine(idx, { productId: e.target.value, unitPrice: p.sellPrice })
                    }}>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                    <Input className="w-20" type="number" min="1" value={it.qty} onChange={(e) => updateLine(idx, { qty: Number(e.target.value) })} />
                    <Input className="w-28" type="number" step="any" value={it.unitPrice} onChange={(e) => updateLine(idx, { unitPrice: Number(e.target.value) })} />
                    <button type="button" onClick={() => removeLine(idx)} className="p-2 text-muted hover:text-danger"><X size={16} /></button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select label="Medio de pago" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                </Select>
                <Input label="Cliente (opcional)" value={client} onChange={(e) => setClient(e.target.value)} />
              </div>
              <Input label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />

              <div className="bg-brand-light rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-brand-dark font-semibold text-sm">Total</span>
                <span className="font-display text-xl font-semibold text-brand-dark">{money(total)}</span>
              </div>

              <Button type="submit" className="w-full justify-center" disabled={saving || items.length === 0}>
                {saving ? 'Guardando…' : 'Registrar venta'}
              </Button>
            </>
          )}
        </form>
      </Modal>
    </Layout>
  )
}
