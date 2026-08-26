import { NextResponse } from "next/server";
import { revalidatePublicContent } from "@/lib/cache/public";
import {
  listPortfolioRevisions,
  restorePortfolioRevision,
} from "@/lib/storage/local";
import { StorageError } from "@/lib/storage/types";

const VIDEO_LIST_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  try {
    const revisions = await listPortfolioRevisions();
    return NextResponse.json({ revisions }, { headers: VIDEO_LIST_HEADERS });
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load video history." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { version?: number };
    const version = Number(body.version);
    if (!Number.isSafeInteger(version) || version < 1) {
      return NextResponse.json(
        { error: "A saved version number is required." },
        { status: 400 },
      );
    }

    const restored = await restorePortfolioRevision(version);
    revalidatePublicContent();
    return NextResponse.json(restored.videos, { headers: VIDEO_LIST_HEADERS });
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to restore that video library save." },
      { status: 500 },
    );
  }
}
