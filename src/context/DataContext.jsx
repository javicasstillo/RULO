import { createContext, useContext, useEffect, useState } from 'react'
import { listenCollection } from '../lib/firestore'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

const COLLECTIONS = [
  ['ingredients', 'name'],
  ['products', 'name'],
  ['sales', 'date'],
  ['expenses', 'date'],
  ['cashMovements', 'date'],
  ['clients', 'name'],
  ['stockMovements', 'createdAt'],
]

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [data, setData] = useState({
    ingredients: [], products: [], sales: [], expenses: [],
    cashMovements: [], clients: [], stockMovements: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsubs = COLLECTIONS.map(([name, orderField]) =>
      listenCollection(name, (rows) => {
        setData((prev) => ({ ...prev, [name]: rows }))
      }, orderField)
    )
    setLoading(false)
    return () => unsubs.forEach((u) => u && u())
  }, [user])

  const ingredientsById = Object.fromEntries(data.ingredients.map((i) => [i.id, i]))
  const productsById = Object.fromEntries(data.products.map((p) => [p.id, p]))

  return (
    <DataContext.Provider value={{ ...data, ingredientsById, productsById, loading }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
