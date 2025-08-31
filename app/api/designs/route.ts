import { NextResponse } from "next/server"
import { db, generateId } from "@/lib/in-memory-db"

// Export existing POST (keep as-is)
export async function POST(request: Request) {
  try {
    const { title, description, color, size, frontImage, backImage, price } = await request.json()
    if (!title || !description || !frontImage) {
      return NextResponse.json({ message: "title, description, and frontImage are required" }, { status: 400 })
    }
    const id = generateId("dsg")
    const record = {
      id,
      title,
      description,
      color,
      size,
      frontImage, // Data URL
      backImage, // optional Data URL
      price: typeof price === "number" ? price : 0,
      createdAt: new Date().toISOString(),
    }
    db.designs.push(record)
    return NextResponse.json({ id })
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ items: db.designs })
}
