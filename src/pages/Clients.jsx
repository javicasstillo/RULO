import { useMemo, useState } from 'react'
import { Plus, Trash2, Pencil, Users } from 'lucide-react'
import Layout from '../components/Layout'
import { Card, Button, Input, Modal, EmptyState, Badge } from '../components/ui'
import { useData } from '../context/DataContext'
import { addClient, updateClient, deleteClient } from '../lib/firestore'
import { money } from '../lib/units'

const empty = { name: '', phone: '', notes: '' }

export default function Clients() {
  const { clients, sales } = useData()
  const [modal, setModal] = useState(false)
  const [current, setCurrent] = useState(null)
  const [form, setForm] = useState(empty)

  const spentByClient = useMemo(() => {
    const map = {}
    sales.forEach((s) => {
      if (!s.client) return
      map[s.client] = (map[s.client] || 0) + (s.total || 0)
    })
    return map
  }, [sales])

  const openNew = () => { setCurrent(null); setForm(empty); setModal(true) }
  const openEdit = (c) => { setCurrent(c); setForm({ name: c.name, phone: c.phone || '', notes: c.notes || '' }); setModal(true) }

  const submit = async (e) => {
    e.preventDefault()
    if (current) await updateClient(current.id, form)
    else await addClient(form)
    setModal(false)
  }

  return (
    <Layout title="Clientes" subtitle="Un registro simple de quién te compra"
      action={<Button onClick={openNew}><Plus size={16} />Nuevo cliente</Button>}>
      <Card>
        {clients.length === 0 ? (
          <EmptyState icon={Users} title="Sin clientes cargados" subtitle="Podés registrar clientes frecuentes para llevar un historial de compras." action={<Button onClick={openNew}><Plus size={16} />Nuevo cliente</Button>} />
        ) : (
          <table className="data-table w-full">
            <thead><tr><th>Nombre</th><th>Teléfono</th><th>Gastado (por nombre en ventas)</th><th>Notas</th><th></th></tr></thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium text-ink">{c.name}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{spentByClient[c.name] ? <Badge tone="success">{money(spentByClient[c.name])}</Badge> : '—'}</td>
                  <td className="text-muted text-sm">{c.notes || '—'}</td>
                  <td>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-lavender text-muted hover:text-ink"><Pencil size={16} /></button>
                      <button onClick={() => deleteClient(c.id)} className="p-1.5 rounded-md hover:bg-danger-light text-muted hover:text-danger"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={current ? 'Editar cliente' : 'Nuevo cliente'}>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Nombre" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Pide sin picante, encarga para eventos, etc." />
          <Button type="submit" className="w-full justify-center">{current ? 'Guardar cambios' : 'Crear cliente'}</Button>
        </form>
      </Modal>
    </Layout>
  )
}
