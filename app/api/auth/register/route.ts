import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase"

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

    // Create new user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // will be stored in user_metadata
      },
    })

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json({
      id: data.user?.id,
      name: data.user?.user_metadata?.name,
      email: data.user?.email,
    })
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Server error" }, { status: 500 })
  }
}

