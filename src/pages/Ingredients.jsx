import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, PackagePlus, Wheat, SlidersHorizontal } from 'lucide-react'
import Layout from '../components/Layout'
import { Card, Button, Input, Select, Modal, Badge, EmptyState } from '../components/ui'
import { useData } from '../context/DataContext'
import {
  addIngredient, updateIngredient, deleteIngredient, registerPurchase, adjustStock,
} from '../lib/firestore'
import { UNIT_TYPES, baseUnitFor, costPer100, number, money } from '../lib/units'

const emptyForm = {
  name: '', brand: '', unitType: 'peso', purchaseQty: '', purchaseUnit: 'kg', purchasePrice: '',
  minStock: '', supplier: '', initialStock: '',
}

export default function Ingredients() {
  const { ingredients } = useData()
  const [modal, setModal] = useState(null) // 'new' | 'edit' | 'purchase' | 'adjust'
  const [current, setCurrent] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [purchaseForm, setPurchaseForm] = useState({ qty: '', unit: 'kg', price: '', supplier: '', note: '' })
  const [adjustForm, setAdjustForm] = useState({ delta: '', note: '' })
  const [search, setSearch] = useState('')

  const previewCost100 = useMemo(() => {
    if (!form.purchaseQty || !form.purchasePrice) return null
    return costPer100(form.purchaseQty, form.purchaseUnit, form.purchasePrice)
  }, [form.purchaseQty, form.purchaseUnit, form.purchasePrice])

  const openNew = () => { setForm(emptyForm); setModal('new') }
  const openEdit = (ing) => {
    setCurrent(ing)
    setForm({
      name: ing.name, brand: ing.brand || '', unitType: ing.unitType, purchaseQty: ing.purchaseQty, purchaseUnit: ing.purchaseUnit,
      purchasePrice: ing.purchasePrice, minStock: ing.minStock, supplier: ing.supplier || '', initialStock: '',
    })
    setModal('edit')
  }
  const openPurchase = (ing) => { setCurrent(ing); setPurchaseForm({ qty: '', unit: ing.purchaseUnit, price: '', supplier: ing.supplier || '', note: '' }); setModal('purchase') }
  const openAdjust = (ing) => { setCurrent(ing); setAdjustForm({ delta: '', note: '' }); setModal('adjust') }

  const submitForm = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      brand: form.brand,
      unitType: form.unitType,
      purchaseQty: Number(form.purchaseQty),
      purchaseUnit: form.purchaseUnit,
      purchasePrice: Number(form.purchasePrice),
      minStock: Number(form.minStock) || 0,
      supplier: form.supplier,
      baseUnit: baseUnitFor(form.purchaseUnit),
    }
    if (modal === 'new') {
      await addIngredient({ ...payload, initialStock: form.initialStock ? Number(form.initialStock) : undefined })
    } else {
      await updateIngredient(current.id, payload)
    }
    setModal(null)
  }

  const submitPurchase = async (e) => {
    e.preventDefault()
    await registerPurchase(current.id, {
      qty: Number(purchaseForm.qty), unit: purchaseForm.unit, price: Number(purchaseForm.price),
      supplier: purchaseForm.supplier, note: purchaseForm.note,
    })
    setModal(null)
  }

  const submitAdjust = async (e) => {
    e.preventDefault()
    await adjustStock(current.id, Number(adjustForm.delta), adjustForm.note)
    setModal(null)
  }

  const filtered = ingredients.filter((i) => i.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <Layout
      title="Insumos y stock"
      subtitle="Cargá lo que comprás y el sistema calcula el costo por 100 g / 100 ml automáticamente"
      action={<Button onClick={openNew}><Plus size={16} />Nuevo insumo</Button>}
    >
      <Input placeholder="Buscar insumo…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-xs" />

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={Wheat} title="Todavía no cargaste insumos" subtitle="Sumá jamón, queso, pan, aceitunas… lo que uses para armar tus picadas." action={<Button onClick={openNew}><Plus size={16} />Nuevo insumo</Button>} />
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Insumo</th><th>Última compra</th><th>Costo / 100</th><th>Stock actual</th><th>Mínimo</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const low = (i.currentStock ?? 0) <= (i.minStock ?? 0)
                const c100 = costPer100(i.purchaseQty, i.purchaseUnit, i.purchasePrice)
                return (
                  <tr key={i.id}>
                    <td className="font-medium text-ink">
                      {i.name}
                      {(i.brand || i.supplier) && (
                        <div className="text-xs text-muted">
                          {[i.brand, i.supplier].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </td>
                    <td>{number(i.purchaseQty)} {i.purchaseUnit} · {money(i.purchasePrice)}</td>
                    <td className="font-semibold text-brand-dark">{money(c100)} / 100{i.baseUnit === 'ml' ? 'ml' : i.baseUnit === 'u' ? 'u' : 'g'}</td>
                    <td>{number(i.currentStock)} {i.baseUnit}</td>
                    <td>
                      {low ? <Badge tone="danger">{number(i.minStock)} {i.baseUnit}</Badge> : <span className="text-muted">{number(i.minStock)} {i.baseUnit}</span>}
                    </td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <button title="Registrar compra" onClick={() => openPurchase(i)} className="p-1.5 rounded-md hover:bg-lavender text-muted hover:text-brand"><PackagePlus size={16} /></button>
                        <button title="Ajustar stock" onClick={() => openAdjust(i)} className="p-1.5 rounded-md hover:bg-lavender text-muted hover:text-ink"><SlidersHorizontal size={16} /></button>
                        <button title="Editar" onClick={() => openEdit(i)} className="p-1.5 rounded-md hover:bg-lavender text-muted hover:text-ink"><Pencil size={16} /></button>
                        <button title="Eliminar" onClick={() => confirm(`¿Eliminar "${i.name}"? Esta acción no se puede deshacer.`) && deleteIngredient(i.id)} className="p-1.5 rounded-md hover:bg-danger-light text-muted hover:text-danger"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Nuevo / editar insumo */}
      <Modal open={modal === 'new' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'new' ? 'Nuevo insumo' : 'Editar insumo'}>
        <form onSubmit={submitForm} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jamón crudo" />
            <Input label="Marca (opcional)" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Paladini" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipo" value={form.unitType} onChange={(e) => {
              const unitType = e.target.value
              setForm({ ...form, unitType, purchaseUnit: UNIT_TYPES[unitType].options[0] })
            }}>
              {Object.entries(UNIT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
            <Select label="Unidad de compra" value={form.purchaseUnit} onChange={(e) => setForm({ ...form, purchaseUnit: e.target.value })}>
              {UNIT_TYPES[form.unitType].options.map((u) => <option key={u} value={u}>{u}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cantidad comprada" type="number" step="any" required value={form.purchaseQty} onChange={(e) => setForm({ ...form, purchaseQty: e.target.value })} placeholder="1" />
            <Input label="Precio pagado ($)" type="number" step="any" required value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} placeholder="8000" />
          </div>
          {previewCost100 !== null && (
            <div className="bg-brand-light rounded-lg px-4 py-3 text-sm text-brand-dark font-medium">
              Costo calculado: {money(previewCost100)} cada 100 {baseUnitFor(form.purchaseUnit) === 'u' ? 'unidades' : baseUnitFor(form.purchaseUnit)}
            </div>
          )}
          {modal === 'new' && (
            <Input label="Stock inicial (opcional, en la misma unidad de compra — por defecto usa la cantidad comprada)" type="number" step="any" value={form.initialStock} onChange={(e) => setForm({ ...form, initialStock: e.target.value })} placeholder={form.purchaseQty || '0'} />
          )}
          <Input label={`Stock mínimo (en ${baseUnitFor(form.purchaseUnit)}) — para alertas`} type="number" step="any" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} placeholder="500" />
          <Input label="Proveedor (opcional)" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          <Button type="submit" className="w-full justify-center">{modal === 'new' ? 'Crear insumo' : 'Guardar cambios'}</Button>
        </form>
      </Modal>

      {/* Registrar compra */}
      <Modal open={modal === 'purchase'} onClose={() => setModal(null)} title={`Registrar compra · ${current?.name || ''}`}>
        <form onSubmit={submitPurchase} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cantidad" type="number" step="any" required value={purchaseForm.qty} onChange={(e) => setPurchaseForm({ ...purchaseForm, qty: e.target.value })} />
            <Select label="Unidad" value={purchaseForm.unit} onChange={(e) => setPurchaseForm({ ...purchaseForm, unit: e.target.value })}>
              {current && UNIT_TYPES[current.unitType].options.map((u) => <option key={u} value={u}>{u}</option>)}
            </Select>
          </div>
          <Input label="Precio pagado ($)" type="number" step="any" required value={purchaseForm.price} onChange={(e) => setPurchaseForm({ ...purchaseForm, price: e.target.value })} />
          {purchaseForm.qty && purchaseForm.price && (
            <div className="bg-brand-light rounded-lg px-4 py-3 text-sm text-brand-dark font-medium">
              Nuevo costo: {money(costPer100(purchaseForm.qty, purchaseForm.unit, purchaseForm.price))} cada 100 {baseUnitFor(purchaseForm.unit) === 'u' ? 'unidades' : baseUnitFor(purchaseForm.unit)}
            </div>
          )}
          <Input label="Proveedor" value={purchaseForm.supplier} onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })} />
          <Input label="Nota (opcional)" value={purchaseForm.note} onChange={(e) => setPurchaseForm({ ...purchaseForm, note: e.target.value })} />
          <p className="text-xs text-muted">Esto suma stock, actualiza el costo por 100 y crea un gasto automático en "Gastos".</p>
          <Button type="submit" className="w-full justify-center">Registrar compra</Button>
        </form>
      </Modal>

      {/* Ajuste manual */}
      <Modal open={modal === 'adjust'} onClose={() => setModal(null)} title={`Ajustar stock · ${current?.name || ''}`}>
        <form onSubmit={submitAdjust} className="space-y-4">
          <Input label={`Ajuste en ${current?.baseUnit || ''} (positivo suma, negativo resta)`} type="number" step="any" required value={adjustForm.delta} onChange={(e) => setAdjustForm({ ...adjustForm, delta: e.target.value })} placeholder="-50" />
          <Input label="Motivo" value={adjustForm.note} onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })} placeholder="Merma, vencimiento, conteo físico…" />
          <Button type="submit" className="w-full justify-center">Guardar ajuste</Button>
        </form>
      </Modal>
    </Layout>
  )
}