import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.API_URL
const API_KEY = process.env.API_GATEWAY_KEY

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(`${API_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY ?? "" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
