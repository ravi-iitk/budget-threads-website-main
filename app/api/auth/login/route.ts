import { NextResponse } from "next/server"
import { findUserByEmail, generateToken } from "@/lib/in-memory-db"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ message: "Missing email or password" }, { status: 400 })
    }
    const existing = findUserByEmail(email)
    if (!existing || existing.password !== password) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }
    // refresh token
    existing.token = generateToken()
    const { id, name, token } = existing
    return NextResponse.json({ id, name, email, token })
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Server error" }, { status: 500 })
  }
}
