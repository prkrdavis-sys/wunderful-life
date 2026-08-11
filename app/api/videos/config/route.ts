import { NextResponse } from "next/server";

const DIRECT_UPLOAD_LIMIT_BYTES = 50 * 1024 * 1024;

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  return NextResponse.json({
    // Files now go through the authenticated API and are persisted to
    // Supabase Storage. Never issue Vercel Blob client-upload tokens.
    clientUpload: false,
    handleUploadUrl: `${origin}/api/videos/upload`,
    directUploadLimitBytes: DIRECT_UPLOAD_LIMIT_BYTES,
  });
}
