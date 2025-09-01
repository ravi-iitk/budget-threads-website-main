import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

function encodeBasicAuth(id: string, secret: string) {
  return Buffer.from(`${id}:${secret}`).toString("base64")
}

const COOKIE_NAME = "bt_sid"
const BASE = 399
const FRONT = 99
const BACK = 119
const SHIPMENT = 59

// ✅ Initialize Supabase client (uses your env variables)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // needs service role key for server-side
)

export async function POST(req: NextRequest) {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    return new Response(JSON.stringify({ error: "Missing Razorpay keys" }), { status: 500 })
  }

  const jar = cookies()
  const sid = jar.get(COOKIE_NAME)?.value || "anon"

  // ✅ Fetch cart from Supabase instead of memory
  const { data: cartItems, error } = await supabase
    .from("carts")
    .select("id, qty, price, meta")
    .eq("session_id", sid)

  if (error) {
    console.error("❌ Supabase cart fetch error:", error.message)
    return new Response(JSON.stringify({ error: "Cart fetch failed" }), { status: 500 })
  }

  let itemsTotal = 0
  for (const it of cartItems || []) {
    if (it?.meta && (it.meta.hasFront || it.meta.hasBack)) {
      const perItem = BASE + (it.meta.hasFront ? FRONT : 0) + (it.meta.hasBack ? BACK : 0)
      itemsTotal += perItem * (Number(it.qty) || 1)
    } else {
      itemsTotal += Number(it.price || 0) * (Number(it.qty) || 1)
    }
  }

  const amountINR = itemsTotal + ((cartItems?.length ?? 0) > 0 ? SHIPMENT : 0)
  const amountPaise = amountINR * 100

  const body = {
    amount: amountPaise,
    currency: "INR",
    notes: { source: "BudgetThreads", items: String(cartItems?.length ?? 0) },
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
    console.error("🔥 Razorpay API failed:", t)
    return new Response(JSON.stringify({ error: "Razorpay order failed", detail: t }), { status: 500 })
  }

  const order = await resp.json()
  return new Response(
    JSON.stringify({ order, publicKey: keyId, amountINR, shipment: (cartItems?.length ?? 0) > 0 ? SHIPMENT : 0 }),
    { status: 200 }
  )
}


