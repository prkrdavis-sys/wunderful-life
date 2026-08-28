import { NextResponse } from "next/server";
import { revalidatePublicContent } from "@/lib/cache/public";
import { readSiteRecord, reorderCollagePhotos } from "@/lib/storage/site";
import { StorageError } from "@/lib/storage";
import { expectedSiteVersion } from "@/lib/storage/siteVersion";
import { siteResponseHeaders } from "@/lib/site/response";

function parseOrderedIds(body: unknown): string[] {
  if (!body || typeof body !== "object") {
    throw new StorageError("orderedIds required.", 400);
  }

  const orderedIds = (body as { orderedIds?: unknown }).orderedIds;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new StorageError("orderedIds required.", 400);
  }
  if (!orderedIds.every((id) => typeof id === "string" && id.length > 0)) {
    throw new StorageError("orderedIds must be photo ids.", 400);
  }

  return orderedIds;
}

export async function PATCH(request: Request) {
  try {
    const version = expectedSiteVersion(request);
    const orderedIds = parseOrderedIds(await request.json());
    const site = await reorderCollagePhotos(orderedIds, version);
    const record = await readSiteRecord();
    revalidatePublicContent();
    return NextResponse.json(site, {
      headers: siteResponseHeaders(record.version, {
        updatedAt: record.updatedAt,
      }),
    });
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to reorder photos." }, { status: 500 });
  }
}
