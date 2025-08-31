import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getCart } from "@/lib/in-memory-db"

function encodeBasicAuth(id: string, secret: string) {
  // Node Buffer is available in Next.js server runtime
  return Buffer.from(`${id}:${secret}`).toString("base64")
}

const COOKIE_NAME = "bt_sid"
const BASE = 399
const FRONT = 99
const BACK = 119
const SHIPMENT = 59

export async function POST(req: NextRequest) {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    return new Response(JSON.stringify({ error: "Missing Razorpay keys in Project Settings." }), { status: 500 })
  }

  const jar = cookies()
  const sid = jar.get(COOKIE_NAME)?.value || "anon"
  const cartItems = getCart(sid)

  let itemsTotal = 0
  for (const it of cartItems) {
    if (it?.meta && (it.meta.hasFront || it.meta.hasBack)) {
      const perItem = BASE + (it.meta.hasFront ? FRONT : 0) + (it.meta.hasBack ? BACK : 0)
      itemsTotal += perItem * (Number(it.qty) || 1)
    } else {
      itemsTotal += Number(it.price || 0) * (Number(it.qty) || 1)
    }
  }
  const amountINR = itemsTotal + (cartItems.length > 0 ? SHIPMENT : 0)
  const amountPaise = amountINR * 100

  const body = {
    amount: amountPaise,
    currency: "INR",
    notes: { source: "BudgetThreads", items: String(cartItems.length) },
    receipt: `bt_${Date.now()}`,
  }

  const resp = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodeBasicAuth(keyId, keySecret)}`,
    },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    const t = await resp.text()
    return new Response(JSON.stringify({ error: "Razorpay order failed", detail: t }), { status: 500 })
  }

  const order = await resp.json()
  return new Response(
    JSON.stringify({ order, publicKey: keyId, amountINR, shipment: cartItems.length > 0 ? SHIPMENT : 0 }),
    { status: 200 },
  )
}
