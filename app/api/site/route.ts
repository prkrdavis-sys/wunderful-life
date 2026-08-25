import { NextResponse } from "next/server";
import { revalidatePublicContent } from "@/lib/cache/public";
import {
  readSiteRecord,
  updateSiteContent,
} from "@/lib/storage/site";
import type { SiteContent } from "@/lib/site/types";
import { StorageError } from "@/lib/storage";
import { expectedSiteVersion } from "@/lib/storage/siteVersion";
import { siteResponseHeaders } from "@/lib/site/response";

export async function GET() {
  try {
    const record = await readSiteRecord();
    return NextResponse.json(record.content, {
      headers: siteResponseHeaders(record.version),
    });
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load site content." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const version = expectedSiteVersion(request);
    const body = (await request.json()) as SiteContent;
    const site = await updateSiteContent(body, version);
    const record = await readSiteRecord();
    revalidatePublicContent();
    return NextResponse.json(site, {
      headers: siteResponseHeaders(record.version),
    });
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Failed to update site content.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
