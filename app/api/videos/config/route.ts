import { NextResponse } from "next/server";
import {
  getUseBlobStorage,
  VERCEL_DIRECT_UPLOAD_LIMIT_BYTES,
} from "@/lib/storage/blob";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  return NextResponse.json({
    clientUpload: getUseBlobStorage(),
    handleUploadUrl: `${origin}/api/videos/upload`,
    directUploadLimitBytes: VERCEL_DIRECT_UPLOAD_LIMIT_BYTES,
  });
}
