import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, UtensilsCrossed, X } from 'lucide-react'
import Layout from '../components/Layout'
import { Card, Button, Input, Select, Modal, Badge, EmptyState } from '../components/ui'
import { useData } from '../context/DataContext'
import { addProduct, updateProduct, deleteProduct } from '../lib/firestore'
import { productCost, marginPercent, money, number, UNIT_TYPES, baseUnitFor } from '../lib/units'

const emptyForm = { name: '', category: '', description: '', sellPrice: '', recipe: [] }

export default function Products() {
  const { products, ingredients, ingredientsById } = useData()
  const [modal, setModal] = useState(false)
  const [current, setCurrent] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const cost = useMemo(() => productCost(form.recipe, ingredientsById), [form.recipe, ingredientsById])
  const margin = marginPercent(Number(form.sellPrice) || 0, cost)

  const openNew = () => { setCurrent(null); setForm(emptyForm); setModal(true) }
  const openEdit = (p) => { setCurrent(p); setForm({ name: p.name, category: p.category || '', description: p.description || '', sellPrice: p.sellPrice, recipe: p.recipe || [] }); setModal(true) }

  const addLine = () => setForm({ ...form, recipe: [...form.recipe, { ingredientId: ingredients[0]?.id || '', qty: '', unit: ingredients[0] ? UNIT_TYPES[ingredients[0].unitType].options[0] : 'g' }] })
  const updateLine = (idx, patch) => {
    const recipe = [...form.recipe]
    recipe[idx] = { ...recipe[idx], ...patch }
    setForm({ ...form, recipe })
  }
  const removeLine = (idx) => setForm({ ...form, recipe: form.recipe.filter((_, i) => i !== idx) })

  const submit = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name, category: form.category, description: form.description,
      sellPrice: Number(form.sellPrice),
      recipe: form.recipe.map((l) => ({ ingredientId: l.ingredientId, qty: Number(l.qty), unit: l.unit })),
    }
    if (current) await updateProduct(current.id, payload)
    else await addProduct(payload)
    setModal(false)
  }

  return (
    <Layout title="Picadas (recetas)" subtitle="Armá cada picada con sus insumos y mirá el costo y el margen en tiempo real"
      action={<Button onClick={openNew}><Plus size={16} />Nueva picada</Button>}>
      <Card>
        {products.length === 0 ? (
          <EmptyState icon={UtensilsCrossed} title="Todavía no armaste ninguna picada"
            subtitle="Primero cargá tus insumos y después armá acá la receta de cada picada."
            action={<Button onClick={openNew}><Plus size={16} />Nueva picada</Button>} />
        ) : (
          <table className="data-table w-full">
            <thead><tr><th>Picada</th><th>Costo</th><th>Precio venta</th><th>Margen</th><th></th></tr></thead>
            <tbody>
              {products.map((p) => {
                const c = productCost(p.recipe, ingredientsById)
                const m = marginPercent(p.sellPrice, c)
                return (
                  <tr key={p.id}>
                    <td className="font-medium text-ink">{p.name}{p.category && <span className="text-xs text-muted ml-2">· {p.category}</span>}</td>
                    <td>{money(c)}</td>
                    <td className="font-semibold">{money(p.sellPrice)}</td>
                    <td><Badge tone={m >= 40 ? 'success' : m >= 15 ? 'gold' : 'danger'}>{number(m, 1)}%</Badge></td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-lavender text-muted hover:text-ink"><Pencil size={16} /></button>
                        <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-md hover:bg-danger-light text-muted hover:text-danger"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={current ? 'Editar picada' : 'Nueva picada'} wide>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Picada Clásica" />
            <Input label="Categoría" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Individual / Grande / Dulce" />
          </div>
          <Input label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Jamón, queso, aceitunas, grisines…" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted">Receta (insumos que usa)</span>
              <Button type="button" size="sm" variant="secondary" onClick={addLine}><Plus size={14} />Agregar insumo</Button>
            </div>
            {ingredients.length === 0 ? (
              <p className="text-sm text-muted">Cargá insumos primero en "Insumos y stock".</p>
            ) : (
              <div className="space-y-2">
                {form.recipe.map((line, idx) => {
                  const ing = ingredientsById[line.ingredientId]
                  return (
                    <div key={idx} className="flex gap-2 items-end bg-lavender/60 rounded-lg p-2.5">
                      <Select className="flex-1" value={line.ingredientId} onChange={(e) => updateLine(idx, { ingredientId: e.target.value, unit: UNIT_TYPES[ingredientsById[e.target.value]?.unitType || 'peso'].options[0] })}>
                        {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </Select>
                      <Input className="w-24" type="number" step="any" placeholder="Cant." value={line.qty} onChange={(e) => updateLine(idx, { qty: e.target.value })} />
                      <Select className="w-24" value={line.unit} onChange={(e) => updateLine(idx, { unit: e.target.value })}>
                        {ing && UNIT_TYPES[ing.unitType].options.map((u) => <option key={u} value={u}>{u}</option>)}
                      </Select>
                      <button type="button" onClick={() => removeLine(idx)} className="p-2 text-muted hover:text-danger"><X size={16} /></button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <Input label="Precio de venta ($)" type="number" step="any" required value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} />

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-lavender rounded-lg px-4 py-3">
              <div className="text-xs text-muted font-semibold">Costo total</div>
              <div className="font-display text-lg font-semibold text-ink">{money(cost)}</div>
            </div>
            <div className="bg-brand-light rounded-lg px-4 py-3">
              <div className="text-xs text-brand-dark font-semibold">Margen</div>
              <div className="font-display text-lg font-semibold text-brand-dark">{number(margin, 1)}%</div>
            </div>
          </div>

          <Button type="submit" className="w-full justify-center">{current ? 'Guardar cambios' : 'Crear picada'}</Button>
        </form>
      </Modal>
    </Layout>
  )
}
