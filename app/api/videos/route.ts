import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createVideo, listVideos, reorderVideos, StorageError } from "@/lib/storage";
import {
  parseCreateVideoForm,
  parseUploadFiles,
} from "@/lib/videos/form";

const VIDEO_LIST_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

function revalidateVideoPages() {
  revalidatePath("/", "layout");
  revalidatePath("/work");
}

export async function GET() {
  const videos = await listVideos();
  return NextResponse.json(videos, { headers: VIDEO_LIST_HEADERS });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const video = await createVideo(
      parseCreateVideoForm(form),
      parseUploadFiles(form),
    );
    revalidateVideoPages();

    return NextResponse.json(video, { status: 201, headers: VIDEO_LIST_HEADERS });
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Failed to create video.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { orderedIds?: string[] };
    if (!body.orderedIds?.length) {
      return NextResponse.json({ error: "orderedIds required." }, { status: 400 });
    }

    const videos = await reorderVideos(body.orderedIds);
    revalidateVideoPages();
    return NextResponse.json(videos, { headers: VIDEO_LIST_HEADERS });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to reorder videos." }, { status: 500 });
  }
}
