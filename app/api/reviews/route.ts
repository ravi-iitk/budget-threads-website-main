import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/in-memory-db"
import { getSupabaseServer } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get("productId")

  try {
    const supabase = getSupabaseServer({
      get: (n: string) => cookies().get(n) as any,
      set: () => {},
    })
    let query = supabase.from("reviews").select("*").order("created_at", { ascending: false })
    if (productId) query = query.eq("product_id", productId)
    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data || [])
  } catch {
    const list = db.reviews.filter((r) => (productId ? r.productId === productId : true))
    return NextResponse.json(list)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { productId, rating, text, userEmail } = await req.json()
    if (!productId || !rating) {
      return NextResponse.json({ error: "Missing productId or rating" }, { status: 400 })
    }

    // try supabase insert
    try {
      const supabase = getSupabaseServer({
        get: (n: string) => cookies().get(n) as any,
        set: () => {},
      })
      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        rating: Math.max(1, Math.min(5, Number(rating))),
        text: text || "",
        user_email: userEmail || null,
      })
      if (error) throw error
      return NextResponse.json({ ok: true })
    } catch {
      // fallback to in-memory
      db.reviews.push({
        productId,
        rating: Math.max(1, Math.min(5, Number(rating))),
        text: text || "",
        createdAt: Date.now(),
      })
      return NextResponse.json({ ok: true, fallback: true })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}
