import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get("filename") || `recording-${Date.now()}.webm`

    // Get the request body as a blob
    const blob = await request.blob()

    if (!blob || blob.size === 0) {
      return NextResponse.json({ error: "No file data provided" }, { status: 400 })
    }

    console.log("📤 Uploading blob:", {
      filename,
      size: blob.size,
      type: blob.type,
    })

    // Upload to Vercel Blob
    const uploadResult = await put(filename, blob, {
      access: "public",
      addRandomSuffix: true,
    })

    console.log("✅ Blob upload successful:", uploadResult.url)

    return NextResponse.json({
      url: uploadResult.url,
      downloadUrl: uploadResult.downloadUrl,
      pathname: uploadResult.pathname,
      size: uploadResult.size,
    })
  } catch (error) {
    console.error("❌ Blob upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to upload to blob storage",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
