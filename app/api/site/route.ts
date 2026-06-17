import { NextResponse } from "next/server";
import { readSiteContent, updateSiteContent } from "@/lib/storage/site";
import type { SiteContent } from "@/lib/site/types";
import { StorageError } from "@/lib/storage";

export async function GET() {
  const site = await readSiteContent();
  return NextResponse.json(site);
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as SiteContent;
    const site = await updateSiteContent(body);
    return NextResponse.json(site);
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to update site content." }, { status: 500 });
  }
}
