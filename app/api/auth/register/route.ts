import { NextResponse } from "next/server"
import { db, findUserByEmail, generateId, generateToken } from "@/lib/in-memory-db"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }
    if (findUserByEmail(email)) {
      return NextResponse.json({ message: "Email already registered" }, { status: 409 })
    }
    const token = generateToken()
    const user = { id: generateId("usr"), name, email, password, token }
    db.users.push(user)
    return NextResponse.json({ id: user.id, name, email, token })
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Server error" }, { status: 500 })
  }
}
