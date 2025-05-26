import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { CF_ACCOUNT_ID, STREAM_API_TOKEN } = process.env

  if (!CF_ACCOUNT_ID || !STREAM_API_TOKEN) {
    return NextResponse.json({ error: "Environment variables missing" }, { status: 500 })
  }

  try {
    const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/direct_upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STREAM_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ maxDurationSeconds: 300 }),
    })

    const { success, errors, result } = await cfRes.json()

    if (!success) {
      return NextResponse.json({ error: errors }, { status: 502 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "Failed to get upload URL" }, { status: 500 })
  }
}
