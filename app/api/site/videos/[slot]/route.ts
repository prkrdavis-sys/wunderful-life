import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  clearSlotVideo,
  setSlotVideoUrl,
  uploadSlotVideo,
} from "@/lib/storage/site";
import { readSiteRecord } from "@/lib/storage/site";
import { StorageError } from "@/lib/storage";
import { expectedSiteVersion } from "@/lib/storage/siteVersion";
import { siteResponseHeaders } from "@/lib/site/response";
import { isVideoSlot, videoSlotDescriptor } from "@/lib/site/video-slots";
import { isAcceptedVideoFile, videoUploadErrorMessage } from "@/lib/videos/upload";

type RouteContext = {
  params: Promise<{ slot: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { slot: rawSlot } = await context.params;
  if (!isVideoSlot(rawSlot)) {
    return NextResponse.json({ error: "Unknown video slot." }, { status: 404 });
  }
  const slot = rawSlot;
  const descriptor = videoSlotDescriptor(slot);

  try {
    const version = expectedSiteVersion(request);
    const form = await request.formData();
    const videoUrl = form.get("videoUrl");
    const file = form.get("video");
    const posterFile =
      descriptor.persistPoster &&
      form.get("poster") instanceof File &&
      (form.get("poster") as File).size > 0
        ? (form.get("poster") as File)
        : undefined;
    const posterRemoteRaw = form.get("posterUrl");
    const posterRemote =
      descriptor.persistPoster &&
      typeof posterRemoteRaw === "string" &&
      posterRemoteRaw.startsWith("https://")
        ? posterRemoteRaw
        : undefined;

    if (typeof videoUrl === "string" && videoUrl.startsWith("https://")) {
      const site = await setSlotVideoUrl(slot, videoUrl, version, posterRemote);
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
      return NextResponse.json(
        { error: videoUploadErrorMessage() },
        { status: 400 },
      );
    }

    const site = await uploadSlotVideo(slot, file, version, posterFile);
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
      { error: `Failed to upload ${descriptor.noun}.` },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { slot: rawSlot } = await context.params;
  if (!isVideoSlot(rawSlot)) {
    return NextResponse.json({ error: "Unknown video slot." }, { status: 404 });
  }
  const slot = rawSlot;
  const descriptor = videoSlotDescriptor(slot);

  try {
    const version = expectedSiteVersion(request);
    const site = await clearSlotVideo(slot, version);
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
      { error: `Failed to remove ${descriptor.noun}.` },
      { status: 500 },
    );
  }
}
