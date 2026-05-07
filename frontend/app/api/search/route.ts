import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.API_URL

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(`${API_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
