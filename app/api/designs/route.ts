import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db, generateId } from "@/lib/in-memory-db"
import { getSupabaseServer } from "@/lib/supabase"

const COOKIE_NAME = "bt_sid"

export async function POST(request: Request) {
  try {
    const { title, description, color, size, frontImage, backImage, price } = await request.json()
    if (!title || !description || !frontImage) {
      return NextResponse.json({ message: "title, description, and frontImage are required" }, { status: 400 })
    }

    try {
      const jar = cookies()
      const sessionId = jar.get(COOKIE_NAME)?.value || null
      const supabase = getSupabaseServer({
        get: (n: string) => jar.get(n) as any,
        set: () => {},
      })
      const { data, error } = await supabase
        .from("designs")
        .insert({
          session_id: sessionId,
          title,
          description,
          color,
          size,
          front_image: frontImage,
          back_image: backImage || null,
          price: typeof price === "number" ? price : 0,
        })
        .select("id")
        .single()
      if (error) throw error
      return NextResponse.json({ id: data?.id })
    } catch {
      const id = generateId("dsg")
      const record = {
        id,
        title,
        description,
        color,
        size,
        frontImage,
        backImage: backImage || null,
        price: typeof price === "number" ? price : 0,
        createdAt: new Date().toISOString(),
      }
      db.designs.push(record)
      return NextResponse.json({ id })
    }
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseServer({
      get: (n: string) => cookies().get(n) as any,
      set: () => {},
    })
    const { data, error } = await supabase.from("designs").select("*").order("created_at", { ascending: false })
    if (error) throw error
    return NextResponse.json({ items: data || [] })
  } catch {
    return NextResponse.json({ items: db.designs })
  }
}
