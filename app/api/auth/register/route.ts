import { NextResponse } from "next/server"
import { generateId, generateToken } from "@/lib/in-memory-db" // we can still reuse id & token generator
import { getSupabaseServer } from "@/lib/supabase" // helper you already used for cart

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const supabase = getSupabaseServer({
      get: () => null,
      set: () => {},
    })

    // 1. Check if user already exists
    const { data: existing, error: findErr } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (findErr) throw findErr
    if (existing) {
      return NextResponse.json({ message: "Email already registered" }, { status: 409 })
    }

    // 2. Create new user
    const token = generateToken()
    const user = {
      id: generateId("usr"),
      name,
      email,
      password, // ⚠️ Ideally hash this before storing
      token,
      created_at: new Date().toISOString(),
    }

    const { error: insertErr } = await supabase.from("users").insert(user)
    if (insertErr) throw insertErr

    // 3. Return response
    return NextResponse.json({ id: user.id, name, email, token })
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Server error" }, { status: 500 })
  }
}
