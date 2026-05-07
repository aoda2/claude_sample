import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.API_URL
const API_KEY = process.env.API_GATEWAY_KEY

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ task_id: string }> }
) {
  const { task_id } = await params
  const res = await fetch(`${API_URL}/search/${task_id}`, {
    headers: { "x-api-key": API_KEY ?? "" },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
