import { NextResponse } from "next/server";
import { revalidatePublicContent } from "@/lib/cache/public";
import { siteResponseHeaders } from "@/lib/site/response";
import {
  listSiteContentRevisions,
  readSiteRecord,
  restoreSiteContentRevision,
} from "@/lib/storage/site";
import { expectedSiteVersion } from "@/lib/storage/siteVersion";
import { StorageError } from "@/lib/storage/types";

export async function GET() {
  try {
    const [record, revisions] = await Promise.all([
      readSiteRecord(),
      listSiteContentRevisions(),
    ]);
    return NextResponse.json(
      {
        currentVersion: record.version,
        updatedAt: record.updatedAt,
        revisions,
      },
      {
        headers: siteResponseHeaders(record.version, {
          updatedAt: record.updatedAt,
        }),
      },
    );
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load site history." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const expectedVersion = expectedSiteVersion(request);
    const body = (await request.json()) as { version?: number };
    const version = Number(body.version);
    if (!Number.isSafeInteger(version) || version < 1) {
      return NextResponse.json(
        { error: "A saved version number is required." },
        { status: 400 },
      );
    }

    const restored = await restoreSiteContentRevision(version, expectedVersion);
    revalidatePublicContent();
    return NextResponse.json(restored.content, {
      headers: siteResponseHeaders(restored.version, {
        updatedAt: restored.updatedAt,
      }),
    });
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to restore that site save." },
      { status: 500 },
    );
  }
}
