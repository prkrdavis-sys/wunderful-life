import { NextResponse } from "next/server";
import { isMediaUploadDir } from "@/lib/storage/media-upload";
import {
  createSignedPublicMediaUpload,
  hasSupabaseMediaConfig,
} from "@/lib/storage/supabase-media";
import { StorageError } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    if (!hasSupabaseMediaConfig()) {
      return NextResponse.json(
        { error: "Media storage is not configured." },
        { status: 503 },
      );
    }

    const body = (await request.json()) as {
      dir?: unknown;
      filename?: unknown;
    };
    const dir = typeof body.dir === "string" ? body.dir : "";
    const filename = typeof body.filename === "string" ? body.filename.trim() : "";

    if (!isMediaUploadDir(dir) || !filename) {
      return NextResponse.json(
        { error: "A valid upload folder and filename are required." },
        { status: 400 },
      );
    }

    const upload = await createSignedPublicMediaUpload(dir, filename);
    return NextResponse.json(upload);
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Could not start upload." },
      { status: 500 },
    );
  }
}
