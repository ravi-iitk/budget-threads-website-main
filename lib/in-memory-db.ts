export type StoredUser = {
  id: string
  name: string
  email: string
  password: string // NOTE: plain text for demo only
  token: string
}

export const db = {
  users: [] as StoredUser[],
  designs: [] as any[],
  carts: {} as Record<string, any[]>,
  reviews: [] as any[], // { productId, rating, text, createdAt }
  orders: [] as any[], // store orders in-memory until Supabase table exists
  products: [] as any[], // optional products store for /api/products if used
}

export const DB = db

export function findUserByEmail(email: string) {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export function generateId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export function generateToken() {
  return `${Math.random().toString(36).slice(2)}.${Math.random().toString(36).slice(2)}`
}

export function getCart(sessionId: string) {
  if (!db.carts[sessionId]) db.carts[sessionId] = []
  return db.carts[sessionId]
}

export function saveOrder(o: {
  session?: string | null
  orderId: string
  amountINR: number
  items: any[]
  status: string
  meta?: Record<string, any>
}) {
  const rec = { id: generateId("ord"), createdAt: new Date().toISOString(), ...o }
  db.orders.push(rec)
  return rec
}
