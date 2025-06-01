import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔧 API: Getting upload URL...")

    const { CF_ACCOUNT_ID, STREAM_API_TOKEN } = process.env

    console.log("🔧 Environment check:", {
      CF_ACCOUNT_ID: CF_ACCOUNT_ID ? "✅ Present" : "❌ Missing",
      STREAM_API_TOKEN: STREAM_API_TOKEN ? "✅ Present" : "❌ Missing",
    })

    if (!CF_ACCOUNT_ID || !STREAM_API_TOKEN) {
      console.error("❌ Missing Cloudflare environment variables")
      return NextResponse.json(
        {
          error: "Cloudflare environment variables not configured",
          details: {
            CF_ACCOUNT_ID: !CF_ACCOUNT_ID ? "missing" : "present",
            STREAM_API_TOKEN: !STREAM_API_TOKEN ? "missing" : "present",
          },
        },
        { status: 500 },
      )
    }

    const cloudflareUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/direct_upload`

    console.log("🔧 Making request to Cloudflare:", cloudflareUrl)

    const cfRes = await fetch(cloudflareUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STREAM_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maxDurationSeconds: 300,
        requireSignedURLs: false,
        allowedOrigins: ["*"],
      }),
    })

    console.log("🔧 Cloudflare response status:", cfRes.status)

    if (!cfRes.ok) {
      const errorText = await cfRes.text()
      console.error("❌ Cloudflare API error:", {
        status: cfRes.status,
        statusText: cfRes.statusText,
        body: errorText,
      })

      return NextResponse.json(
        {
          error: `Cloudflare API error: ${cfRes.status} ${cfRes.statusText}`,
          details: errorText,
        },
        { status: 502 },
      )
    }

    const responseData = await cfRes.json()
    console.log("✅ Cloudflare response:", {
      success: responseData.success,
      hasResult: !!responseData.result,
      hasUploadURL: !!responseData.result?.uploadURL,
      hasUID: !!responseData.result?.uid,
    })

    const { success, errors, result } = responseData

    if (!success) {
      console.error("❌ Cloudflare API returned success: false", errors)
      return NextResponse.json(
        {
          error: "Cloudflare API returned error",
          details: errors,
        },
        { status: 502 },
      )
    }

    if (!result || !result.uploadURL || !result.uid) {
      console.error("❌ Invalid Cloudflare response structure", result)
      return NextResponse.json(
        {
          error: "Invalid response from Cloudflare",
          details: result,
        },
        { status: 502 },
      )
    }

    console.log("✅ Upload URL generated successfully")
    return NextResponse.json(result)
  } catch (error) {
    console.error("💥 Unexpected error in get-upload-url:", error)
    return NextResponse.json(
      {
        error: "Failed to get upload URL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
