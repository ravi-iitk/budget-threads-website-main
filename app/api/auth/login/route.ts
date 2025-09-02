import { NextResponse } from "next/server"
import { generateToken } from "@/lib/in-memory-db" // still useful for issuing session tokens
import { getSupabaseServer } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ message: "Missing email or password" }, { status: 400 })
    }

    const supabase = getSupabaseServer({
      get: () => null,
      set: () => {},
    })

    // 1. Find user in Supabase
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, password, token")
      .eq("email", email)
      .maybeSingle()

    if (error) throw error
    if (!user || user.password !== password) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // 2. Refresh token
    const newToken = generateToken()
    const { error: updateErr } = await supabase
      .from("users")
      .update({ token: newToken })
      .eq("id", user.id)

    if (updateErr) throw updateErr

    // 3. Return response
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      token: newToken,
    })
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Server error" }, { status: 500 })
  }
}
