import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, canAccessAdmin, isAdminAuthRequired } from "@/lib/auth";
import { getUseBlobStorage } from "@/lib/storage/blob";
import {
  BLOB_THUMBNAIL_CONTENT_TYPES,
  BLOB_VIDEO_CONTENT_TYPES,
} from "@/lib/videos/upload";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const GENERATE_CLIENT_TOKEN = "blob.generate-client-token";

export async function POST(request: Request) {
  if (!getUseBlobStorage()) {
    return NextResponse.json(
      { error: "Blob storage is not configured." },
      { status: 503 },
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  if (body.type === GENERATE_CLIENT_TOKEN && isAdminAuthRequired()) {
    const session = (await cookies()).get(ADMIN_COOKIE)?.value;
    if (!canAccessAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "video/*",
          "image/*",
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
    const message =
      error instanceof Error ? error.message : "Failed to authorize upload.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
