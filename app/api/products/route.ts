import { NextResponse } from "next/server"
import { DB } from "@/lib/in-memory-db"

export async function GET() {
  return NextResponse.json(DB.products)
}
