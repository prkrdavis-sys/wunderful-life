import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  clearHeroVideo,
  setHeroVideoUrl,
  uploadHeroVideo,
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
    const posterUrl = form.get("posterUrl");
    const poster = form.get("poster");
    const posterFile =
      poster instanceof File && poster.size > 0 ? poster : undefined;
    const posterRemote =
      typeof posterUrl === "string" && posterUrl.startsWith("https://")
        ? posterUrl
        : undefined;

    if (typeof videoUrl === "string" && videoUrl.startsWith("https://")) {
      const site = await setHeroVideoUrl(videoUrl, version, posterRemote);
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

    const site = await uploadHeroVideo(file, version, posterFile);
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
      { error: "Failed to upload hero video." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const version = expectedSiteVersion(request);
    const site = await clearHeroVideo(version);
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
      { error: "Failed to remove hero video." },
      { status: 500 },
    );
  }
}
