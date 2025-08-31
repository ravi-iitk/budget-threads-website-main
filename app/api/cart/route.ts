import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getCart, generateId } from "@/lib/in-memory-db"
import { getSupabaseServer } from "@/lib/supabase"

const COOKIE_NAME = "bt_sid"

function getOrCreateSessionId() {
  const store = cookies()
  let sid = store.get(COOKIE_NAME)?.value
  if (!sid) {
    sid = generateId("sid")
    store.set(COOKIE_NAME, sid, { path: "/", httpOnly: false, sameSite: "lax" })
  }
  return sid
}

async function supaRead(supabase: any, sid: string) {
  const { data, error } = await supabase.from("carts").select("items").eq("session_id", sid).maybeSingle()
  if (error && error.code !== "PGRST116") throw error
  if (!data) {
    await supabase.from("carts").insert({ session_id: sid, items: [] })
    return []
  }
  const items = Array.isArray((data as any).items) ? (data as any).items : []
  return items
}

async function supaWrite(supabase: any, sid: string, items: any[]) {
  await supabase.from("carts").upsert({ session_id: sid, items, updated_at: new Date().toISOString() })
}

export async function GET() {
  const sid = getOrCreateSessionId()
  try {
    const supabase = getSupabaseServer({
      get: (n: string) => cookies().get(n) as any,
      set: () => {},
    })
    const items = await supaRead(supabase, sid)
    return NextResponse.json({ items, count: items.length })
  } catch {
    const items = getCart(sid)
    return NextResponse.json({ items, count: items.length })
  }
}

export async function POST(request: Request) {
  const sid = getOrCreateSessionId()
  try {
    const body = await request.json()
    const supabase = getSupabaseServer({
      get: (n: string) => cookies().get(n) as any,
      set: () => {},
    })
    const items = await supaRead(supabase, sid)
    const item = {
      id: generateId("item"),
      title: String(body.title || "Item"),
      price: Number(body.price || 0),
      image: body.image || null,
      designId: body.designId || null,
      productId: body.productId || null,
      qty: Math.max(1, Number(body.qty || 1)),
      meta: body.meta || null,
      addedAt: new Date().toISOString(),
    }
    items.push(item)
    await supaWrite(supabase, sid, items)
    return NextResponse.json({ item, count: items.length })
  } catch {
    const cart = getCart(sid)
    let body: any = {}
    try {
      body = await request.json()
    } catch {}
    const item = {
      id: generateId("item"),
      title: String(body.title || "Item"),
      price: Number(body.price || 0),
      image: body.image || null,
      designId: body.designId || null,
      productId: body.productId || null,
      qty: Math.max(1, Number(body.qty || 1)),
      meta: body.meta || null,
      addedAt: new Date().toISOString(),
    }
    cart.push(item)
    return NextResponse.json({ item, count: cart.length })
  }
}

export async function DELETE(request: Request) {
  const sid = getOrCreateSessionId()
  let payload: any = {}
  try {
    payload = await request.json()
  } catch {}
  try {
    const supabase = getSupabaseServer({
      get: (n: string) => cookies().get(n) as any,
      set: () => {},
    })
    let items = await supaRead(supabase, sid)
    if (payload?.clear) {
      items = []
      await supaWrite(supabase, sid, items)
      return NextResponse.json({ items, count: 0 })
    }
    const itemId = payload?.itemId
    if (!itemId) return NextResponse.json({ message: "Missing itemId or clear=true" }, { status: 400 })
    items = items.filter((i: any) => i.id !== itemId)
    await supaWrite(supabase, sid, items)
    return NextResponse.json({ items, count: items.length })
  } catch {
    const cart = getCart(sid)
    if (payload?.clear) {
      cart.length = 0
      return NextResponse.json({ items: cart, count: 0 })
    }
    const itemId = payload?.itemId
    if (!itemId) return NextResponse.json({ message: "Missing itemId or clear=true" }, { status: 400 })
    const idx = cart.findIndex((i) => i.id === itemId)
    if (idx >= 0) cart.splice(idx, 1)
    return NextResponse.json({ items: cart, count: cart.length })
  }
}
