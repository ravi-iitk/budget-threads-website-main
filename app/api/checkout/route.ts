import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getCart } from "@/lib/in-memory-db"

const COOKIE_NAME = "bt_sid"

function getSessionId() {
  const jar = cookies()
  const sid = jar.get(COOKIE_NAME)?.value
  return sid || "anon"
}

const BASE = 399
const FRONT = 99
const BACK = 119
const SHIPMENT = 59

export async function POST() {
  const sid = getSessionId()
  const items = getCart(sid)

  const itemsTotal = items.reduce((sum, it) => {
    if (it?.meta && (it.meta.hasFront || it.meta.hasBack)) {
      const perItem = BASE + (it.meta.hasFront ? FRONT : 0) + (it.meta.hasBack ? BACK : 0)
      return sum + perItem * (Number(it.qty) || 1)
    }
    return sum + Number(it.price || 0) * (Number(it.qty) || 1)
  }, 0)

  const amount = itemsTotal + (items.length > 0 ? SHIPMENT : 0)
  return NextResponse.json({
    ok: true,
    amount,
    currency: "INR",
    items,
    shipment: items.length > 0 ? SHIPMENT : 0,
    message: "Checkout stub. Integrate Razorpay in Admin later.",
  })
}
