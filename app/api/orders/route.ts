import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getSupabaseServer } from "@/lib/supabase"
import { saveOrder } from "@/lib/in-memory-db"

const COOKIE_NAME = "bt_sid"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const jar = cookies()
  const session = jar.get(COOKIE_NAME)?.value

  try {
    const supabase = getSupabaseServer({
      get: (n: string) => jar.get(n) as any,
      set: () => {},
    })
    const { data, error } = await supabase
      .from("orders")
      .insert({
        session_id: session || null,
        order_id: body.orderId,
        amount_inr: body.amountINR,
        items: body.items || [],
        status: body.status || "paid",
        meta: body.meta || {},
      })
      .select("*")
      .single()

    if (error) throw error
    return new Response(JSON.stringify({ ok: true, data }), { status: 200 })
  } catch (_e) {
    const saved = saveOrder({
      session,
      orderId: body.orderId,
      amountINR: body.amountINR,
      items: body.items || [],
      status: body.status || "paid",
      meta: body.meta || {},
    })
    return new Response(JSON.stringify({ ok: true, data: saved, fallback: true }), { status: 200 })
  }
}
