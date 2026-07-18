// Convierte un Timestamp de Firestore (o null, mientras el serverTimestamp
// se resuelve) a un objeto Date de JS de forma segura.
export function toDate(ts) {
  if (!ts) return null
  if (typeof ts.toDate === 'function') return ts.toDate()
  if (ts instanceof Date) return ts
  return new Date(ts)
}

export function isSameDay(a, b) {
  return a && b && a.toDateString() === b.toDateString()
}

export function isSameMonth(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatDate(ts) {
  const d = toDate(ts)
  if (!d) return '—'
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(ts) {
  const d = toDate(ts)
  if (!d) return '—'
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function dayKey(d) {
  return d.toISOString().slice(0, 10)
}
