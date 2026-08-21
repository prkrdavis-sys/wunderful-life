import { NextResponse } from "next/server";
import { mediaUploadConfig } from "@/lib/storage/media-config";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.json(mediaUploadConfig(origin));
}
