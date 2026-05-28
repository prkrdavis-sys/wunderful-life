import { NextResponse } from "next/server";
import { createVideo, listVideos, reorderVideos, StorageError } from "@/lib/storage";
import {
  parseCreateVideoForm,
  parseUploadFiles,
} from "@/lib/videos/form";

export async function GET() {
  const videos = await listVideos();
  return NextResponse.json(videos);
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const video = await createVideo(
      parseCreateVideoForm(form),
      parseUploadFiles(form),
    );

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to create video." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { orderedIds?: string[] };
    if (!body.orderedIds?.length) {
      return NextResponse.json({ error: "orderedIds required." }, { status: 400 });
    }

    const videos = await reorderVideos(body.orderedIds);
    return NextResponse.json(videos);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to reorder videos." }, { status: 500 });
  }
}
