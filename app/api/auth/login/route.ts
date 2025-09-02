import { NextResponse } from "next/server"
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

    // Sign in with email/password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 401 })
    }

    return NextResponse.json({
      id: data.user?.id,
      name: data.user?.user_metadata?.name,
      email: data.user?.email,
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
    })
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Server error" }, { status: 500 })
  }
}

