import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  clearCtaVideo,
  setCtaVideoUrl,
  uploadCtaVideo,
} from "@/lib/storage/site";
import { readSiteRecord } from "@/lib/storage/site";
import { StorageError } from "@/lib/storage";
import { expectedSiteVersion } from "@/lib/storage/siteVersion";
import { siteResponseHeaders } from "@/lib/site/response";
import { isAcceptedVideoFile, videoUploadErrorMessage } from "@/lib/videos/upload";

export async function POST(request: Request) {
  try {
    const version = expectedSiteVersion(request);
    const form = await request.formData();
    const videoUrl = form.get("videoUrl");
    const file = form.get("video");

    if (typeof videoUrl === "string" && videoUrl.startsWith("https://")) {
      const site = await setCtaVideoUrl(videoUrl, version);
      const record = await readSiteRecord();
      revalidatePath("/", "layout");
      return NextResponse.json(site, {
        headers: siteResponseHeaders(record.version),
      });
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Video file is required." },
        { status: 400 },
      );
    }

    if (!isAcceptedVideoFile(file)) {
      return NextResponse.json({ error: videoUploadErrorMessage() }, { status: 400 });
    }

    const site = await uploadCtaVideo(file, version);
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
    return NextResponse.json(
      { error: "Failed to upload CTA video." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const version = expectedSiteVersion(request);
    const site = await clearCtaVideo(version);
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
    return NextResponse.json(
      { error: "Failed to remove CTA video." },
      { status: 500 },
    );
  }
}
