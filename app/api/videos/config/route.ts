import { NextResponse } from "next/server";
import { hasSupabaseMediaConfig } from "@/lib/storage/supabase-media";
import { MAX_VIDEO_BYTES } from "@/lib/videos/upload";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  return NextResponse.json({
    // When Supabase is configured, the browser uploads straight to Storage
    // so large clips never pass through the Vercel 4.5MB request cap.
    clientUpload: hasSupabaseMediaConfig(),
    handleUploadUrl: `${origin}/api/videos/upload`,
    directUploadLimitBytes: MAX_VIDEO_BYTES,
  });
}
