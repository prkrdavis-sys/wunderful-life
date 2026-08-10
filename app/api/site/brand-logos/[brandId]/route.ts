import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  clearBrandLogo,
  setBrandLogoUrl,
  uploadBrandLogo,
} from "@/lib/storage/site";
import { readSiteRecord } from "@/lib/storage/site";
import { StorageError } from "@/lib/storage";
import { expectedSiteVersion } from "@/lib/storage/siteVersion";
import { siteResponseHeaders } from "@/lib/site/response";

type RouteContext = {
  params: Promise<{ brandId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { brandId } = await context.params;
    const version = expectedSiteVersion(request);
    const form = await request.formData();
    const imageUrl = form.get("imageUrl");
    const file = form.get("photo");

    if (typeof imageUrl === "string" && imageUrl.startsWith("https://")) {
      const site = await setBrandLogoUrl(brandId, imageUrl, version);
      const record = await readSiteRecord();
      revalidatePath("/", "layout");
      return NextResponse.json(site, {
        headers: siteResponseHeaders(record.version),
      });
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Logo file is required." }, { status: 400 });
    }

    const site = await uploadBrandLogo(brandId, file, version);
    const record = await readSiteRecord();
    revalidatePath("/", "layout");
    return NextResponse.json(site, {
      headers: siteResponseHeaders(record.version),
    });
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to upload logo." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { brandId } = await context.params;
    const version = expectedSiteVersion(request);
    const site = await clearBrandLogo(brandId, version);
    const record = await readSiteRecord();
    revalidatePath("/", "layout");
    return NextResponse.json(site, {
      headers: siteResponseHeaders(record.version),
    });
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to remove logo." }, { status: 500 });
  }
}
