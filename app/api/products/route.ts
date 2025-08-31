import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { DB } from "@/lib/in-memory-db"
import { getSupabaseServer } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServer({
      get: (n: string) => cookies().get(n) as any,
      set: () => {},
    })
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })
    if (error) throw error
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json(DB.products)
  }
}
