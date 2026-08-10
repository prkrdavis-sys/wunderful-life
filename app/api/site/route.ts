import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  readSiteRecord,
  updateSiteContent,
} from "@/lib/storage/site";
import type { SiteContent } from "@/lib/site/types";
import { StorageError } from "@/lib/storage";

export async function GET() {
  const record = await readSiteRecord();
  return NextResponse.json(record.content, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      ETag: `"${record.version}"`,
      "X-Site-Version": String(record.version),
    },
  });
}

export async function PATCH(request: Request) {
  try {
    const version = Number(request.headers.get("if-match")?.replaceAll('"', ""));
    if (!Number.isSafeInteger(version) || version < 1) {
      return NextResponse.json(
        { error: "A current site content version is required to save." },
        { status: 428 },
      );
    }

    const body = (await request.json()) as SiteContent;
    const site = await updateSiteContent(body, version);
    const record = await readSiteRecord();
    revalidatePath("/", "layout");
    return NextResponse.json(site, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        ETag: `"${record.version}"`,
        "X-Site-Version": String(record.version),
      },
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
