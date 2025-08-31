import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getCart, generateId } from "@/lib/in-memory-db"

const COOKIE_NAME = "bt_sid"

function getOrCreateSessionId() {
  const store = cookies()
  let sid = store.get(COOKIE_NAME)?.value
  if (!sid) {
    sid = generateId("sid")
    // cookie visible to client for demo; secure flags omitted for local use
    store.set(COOKIE_NAME, sid, { path: "/", httpOnly: false, sameSite: "lax" })
  }
  return sid
}

export async function GET() {
  const sid = getOrCreateSessionId()
  const items = getCart(sid)
  return NextResponse.json({ items, count: items.length })
}

export async function POST(request: Request) {
  try {
    const sid = getOrCreateSessionId()
    const cart = getCart(sid)
    const body = await request.json()

    // expected: { title, price, image?, designId?, productId?, qty?, meta? }
    const item = {
      id: generateId("item"),
      title: String(body.title || "Item"),
      price: Number(body.price || 0),
      image: body.image || null,
      designId: body.designId || null,
      productId: body.productId || null,
      qty: Math.max(1, Number(body.qty || 1)),
      meta: body.meta || null, // store optional meta for pricing rules
      addedAt: new Date().toISOString(),
    }
    cart.push(item)
    return NextResponse.json({ item, count: cart.length })
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const sid = getOrCreateSessionId()
    const cart = getCart(sid)
    let payload: any = {}
    try {
      payload = await request.json()
    } catch {
      // allow empty body for full clear via query-less? We'll require "clear" flag.
    }

    if (payload?.clear) {
      cart.length = 0
      return NextResponse.json({ items: cart, count: 0 })
    }

    const itemId = payload?.itemId
    if (!itemId) {
      return NextResponse.json({ message: "Missing itemId or clear=true" }, { status: 400 })
    }
    const idx = cart.findIndex((i) => i.id === itemId)
    if (idx >= 0) cart.splice(idx, 1)
    return NextResponse.json({ items: cart, count: cart.length })
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Server error" }, { status: 500 })
  }
}
