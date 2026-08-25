import { NextResponse } from "next/server";
import { revalidatePublicContent } from "@/lib/cache/public";
import {
  clearAboutPhoto,
  setAboutPhotoUrl,
  uploadAboutPhoto,
} from "@/lib/storage/site";
import { readSiteRecord } from "@/lib/storage/site";
import { StorageError } from "@/lib/storage";
import { expectedSiteVersion } from "@/lib/storage/siteVersion";
import { siteResponseHeaders } from "@/lib/site/response";

type RouteContext = {
  params: Promise<{ photoId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { photoId } = await context.params;
    const version = expectedSiteVersion(request);
    const form = await request.formData();
    const imageUrl = form.get("imageUrl");
    const file = form.get("photo");

    if (typeof imageUrl === "string" && imageUrl.startsWith("https://")) {
      const site = await setAboutPhotoUrl(photoId, imageUrl, version);
      const record = await readSiteRecord();
      revalidatePublicContent();
      return NextResponse.json(site, {
        headers: siteResponseHeaders(record.version),
      });
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Photo file is required." }, { status: 400 });
    }

    const site = await uploadAboutPhoto(photoId, file, version);
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
    return NextResponse.json({ error: "Failed to upload photo." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { photoId } = await context.params;
    const version = expectedSiteVersion(request);
    const site = await clearAboutPhoto(photoId, version);
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
    return NextResponse.json({ error: "Failed to remove photo." }, { status: 500 });
  }
}
