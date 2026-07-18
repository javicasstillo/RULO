// ---------------------------------------------------------------------------
// Motor de costos de RULO Picadas
//
// Idea central: cada insumo se compra en una unidad "de compra" (ej: 1 kg de
// jamón crudo a $8.000) y se necesita saber cuánto cuesta en la unidad "base"
// con la que se arman las recetas (gramos, mililitros o unidades sueltas).
//
// Todo insumo se normaliza a una unidad base según su tipo:
//   - peso   -> gramos (g)
//   - volumen-> mililitros (ml)
//   - unidad -> unidades (u)  (ej: aceitunas, palitos, cajitas)
// ---------------------------------------------------------------------------

export const UNIT_TYPES = {
  peso: { label: 'Peso', base: 'g', options: ['g', 'kg'] },
  volumen: { label: 'Volumen', base: 'ml', options: ['ml', 'l'] },
  unidad: { label: 'Unidad', base: 'u', options: ['u'] },
}

// Factor de conversión de cada unidad hacia su unidad base
const TO_BASE = {
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  u: 1,
}

export function toBaseQty(qty, unit) {
  const factor = TO_BASE[unit] ?? 1
  return Number(qty) * factor
}

export function baseUnitFor(unit) {
  if (unit === 'g' || unit === 'kg') return 'g'
  if (unit === 'ml' || unit === 'l') return 'ml'
  return 'u'
}

// Costo por unidad base a partir de una compra (ej: compré 1kg a $8000 -> $8/g)
export function costPerBaseUnit(purchaseQty, purchaseUnit, purchasePrice) {
  const baseQty = toBaseQty(purchaseQty, purchaseUnit)
  if (!baseQty) return 0
  return Number(purchasePrice) / baseQty
}

// Costo por cada 100 (g o ml) — el dato que pediste explícitamente
export function costPer100(purchaseQty, purchaseUnit, purchasePrice) {
  return costPerBaseUnit(purchaseQty, purchaseUnit, purchasePrice) * 100
}

// Formato de moneda ARS
export const money = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(Number(n) || 0)

export const number = (n, decimals = 2) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: decimals }).format(Number(n) || 0)

// Dado un ingrediente (con costPerBaseUnitValue ya calculado y guardado en Firestore)
// y una cantidad de receta con su unidad, devuelve el costo de esa línea de receta.
export function recipeLineCost(ingredient, qty, unit) {
  if (!ingredient) return 0
  const baseQty = toBaseQty(qty, unit)
  return baseQty * (ingredient.costPerBaseUnit || 0)
}

// Costo total de un producto (picada) sumando todas las líneas de receta
export function productCost(recipe = [], ingredientsById = {}) {
  return recipe.reduce((sum, line) => {
    const ing = ingredientsById[line.ingredientId]
    return sum + recipeLineCost(ing, line.qty, line.unit)
  }, 0)
}

export function marginPercent(sellPrice, cost) {
  const price = Number(sellPrice) || 0
  if (price <= 0) return 0
  return ((price - cost) / price) * 100
}

export function markupPercent(sellPrice, cost) {
  const c = Number(cost) || 0
  if (c <= 0) return 0
  return ((sellPrice - c) / c) * 100
}
