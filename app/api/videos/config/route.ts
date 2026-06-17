import { NextResponse } from "next/server";
import { useBlobStorage } from "@/lib/storage/blob";

export async function GET() {
  return NextResponse.json({
    clientUpload: useBlobStorage,
    handleUploadUrl: "/api/videos/upload",
  });
}
