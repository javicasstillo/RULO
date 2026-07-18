import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, orderBy, serverTimestamp, runTransaction, getDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { costPerBaseUnit, toBaseQty } from './units'

// ---- helpers genéricos --------------------------------------------------

export function listenCollection(name, cb, orderField = 'createdAt') {
  const q = query(collection(db, name), orderBy(orderField, 'desc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export const col = (name) => collection(db, name)
export const ref = (name, id) => doc(db, name, id)

// ---- INGREDIENTES / INSUMOS ---------------------------------------------

export async function addIngredient(data) {
  const cpu = costPerBaseUnit(data.purchaseQty, data.purchaseUnit, data.purchasePrice)
  return addDoc(col('ingredients'), {
    ...data,
    costPerBaseUnit: cpu,
    currentStock: toBaseQty(data.initialStock ?? data.purchaseQty, data.purchaseUnit),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateIngredient(id, data) {
  const cpu = costPerBaseUnit(data.purchaseQty, data.purchaseUnit, data.purchasePrice)
  return updateDoc(ref('ingredients', id), {
    ...data,
    costPerBaseUnit: cpu,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteIngredient(id) {
  return deleteDoc(ref('ingredients', id))
}

// Registrar una compra de insumo: actualiza costo unitario, stock y deja
// un movimiento + un gasto (egreso) automáticamente.
export async function registerPurchase(ingredientId, { qty, unit, price, supplier, note }) {
  const ingredientRef = ref('ingredients', ingredientId)
  const snap = await getDoc(ingredientRef)
  if (!snap.exists()) throw new Error('Insumo no encontrado')
  const ing = snap.data()

  const baseQtyAdded = toBaseQty(qty, unit)
  const newCostPerBase = costPerBaseUnit(qty, unit, price)

  await updateDoc(ingredientRef, {
    purchaseQty: qty,
    purchaseUnit: unit,
    purchasePrice: price,
    costPerBaseUnit: newCostPerBase,
    currentStock: (ing.currentStock || 0) + baseQtyAdded,
    lastPurchaseDate: serverTimestamp(),
    supplier: supplier || ing.supplier || '',
    updatedAt: serverTimestamp(),
  })

  await addDoc(col('stockMovements'), {
    ingredientId,
    ingredientName: ing.name,
    type: 'compra',
    qtyBase: baseQtyAdded,
    unit,
    note: note || '',
    createdAt: serverTimestamp(),
  })

  await addDoc(col('expenses'), {
    category: 'Insumos',
    description: `Compra de ${ing.name}`,
    amount: Number(price),
    paymentMethod: 'No especificado',
    auto: true,
    date: serverTimestamp(),
    createdAt: serverTimestamp(),
  })
}

// ---- PRODUCTOS (picadas) -------------------------------------------------

export async function addProduct(data) {
  return addDoc(col('products'), {
    ...data,
    active: data.active ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateProduct(id, data) {
  return updateDoc(ref('products', id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteProduct(id) {
  return deleteDoc(ref('products', id))
}

// ---- VENTAS ---------------------------------------------------------------
// Registra una venta, descuenta stock de cada ingrediente usado y crea el
// movimiento de caja (ingreso) correspondiente. Todo en una transacción.

export async function registerSale({ items, paymentMethod, client, notes, products, ingredients }) {
  const ingredientsById = Object.fromEntries(ingredients.map((i) => [i.id, i]))
  const productsById = Object.fromEntries(products.map((p) => [p.id, p]))

  let total = 0
  let totalCost = 0
  const stockDeltas = {} // ingredientId -> baseQty a descontar

  for (const item of items) {
    const product = productsById[item.productId]
    if (!product) continue
    total += item.unitPrice * item.qty
    ;(product.recipe || []).forEach((line) => {
      const ing = ingredientsById[line.ingredientId]
      if (!ing) return
      const baseQty = toBaseQty(line.qty, line.unit) * item.qty
      totalCost += baseQty * (ing.costPerBaseUnit || 0)
      stockDeltas[line.ingredientId] = (stockDeltas[line.ingredientId] || 0) + baseQty
    })
  }

  await runTransaction(db, async (tx) => {
    // leer stock actual de cada ingrediente involucrado
    const refsAndSnaps = await Promise.all(
      Object.keys(stockDeltas).map(async (ingId) => {
        const r = ref('ingredients', ingId)
        const s = await tx.get(r)
        return [ingId, r, s]
      })
    )

    const saleRef = doc(col('sales'))
    tx.set(saleRef, {
      items,
      total,
      totalCost,
      profit: total - totalCost,
      paymentMethod,
      client: client || '',
      notes: notes || '',
      date: serverTimestamp(),
      createdAt: serverTimestamp(),
    })

    for (const [ingId, r, s] of refsAndSnaps) {
      const current = s.exists() ? s.data().currentStock || 0 : 0
      tx.update(r, { currentStock: current - stockDeltas[ingId] })
      const movRef = doc(col('stockMovements'))
      tx.set(movRef, {
        ingredientId: ingId,
        ingredientName: ingredientsById[ingId]?.name || '',
        type: 'venta',
        qtyBase: -stockDeltas[ingId],
        unit: 'base',
        relatedSaleId: saleRef.id,
        createdAt: serverTimestamp(),
      })
    }
  })
}

export async function deleteSale(id) {
  return deleteDoc(ref('sales', id))
}

// ---- GASTOS -----------------------------------------------------------

export async function addExpense(data) {
  return addDoc(col('expenses'), { ...data, date: serverTimestamp(), createdAt: serverTimestamp() })
}
export async function deleteExpense(id) {
  return deleteDoc(ref('expenses', id))
}

// ---- MOVIMIENTOS DE CAJA MANUALES (ingresos/egresos que no son venta/gasto) --

export async function addCashMovement(data) {
  return addDoc(col('cashMovements'), { ...data, date: serverTimestamp(), createdAt: serverTimestamp() })
}
export async function deleteCashMovement(id) {
  return deleteDoc(ref('cashMovements', id))
}

// ---- CLIENTES -----------------------------------------------------------

export async function addClient(data) {
  return addDoc(col('clients'), { ...data, createdAt: serverTimestamp() })
}
export async function updateClient(id, data) {
  return updateDoc(ref('clients', id), data)
}
export async function deleteClient(id) {
  return deleteDoc(ref('clients', id))
}

// ---- AJUSTE MANUAL DE STOCK ---------------------------------------------

export async function adjustStock(ingredientId, deltaBase, note) {
  const ingredientRef = ref('ingredients', ingredientId)
  const snap = await getDoc(ingredientRef)
  if (!snap.exists()) return
  const ing = snap.data()
  await updateDoc(ingredientRef, { currentStock: (ing.currentStock || 0) + deltaBase, updatedAt: serverTimestamp() })
  await addDoc(col('stockMovements'), {
    ingredientId,
    ingredientName: ing.name,
    type: 'ajuste',
    qtyBase: deltaBase,
    unit: 'base',
    note: note || '',
    createdAt: serverTimestamp(),
  })
}
