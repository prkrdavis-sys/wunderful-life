import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import {
  BLOB_THUMBNAIL_CONTENT_TYPES,
  BLOB_VIDEO_CONTENT_TYPES,
} from "@/lib/videos/upload";
import { useBlobStorage } from "@/lib/storage/blob";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export async function POST(request: Request) {
  if (!useBlobStorage) {
    return NextResponse.json(
      { error: "Blob storage is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          ...BLOB_VIDEO_CONTENT_TYPES,
          ...BLOB_THUMBNAIL_CONTENT_TYPES,
        ],
        maximumSizeInBytes: MAX_VIDEO_BYTES,
        addRandomSuffix: false,
      }),
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to authorize upload." },
      { status: 500 },
    );
  }
}
