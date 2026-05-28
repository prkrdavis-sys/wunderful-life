import { NextResponse } from "next/server";
import { deleteVideo, StorageError, updateVideo } from "@/lib/storage";
import {
  parseUpdateVideoForm,
  parseUploadFiles,
} from "@/lib/videos/form";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const form = await request.formData();

    const video = await updateVideo(
      id,
      parseUpdateVideoForm(form),
      parseUploadFiles(form),
    );

    if (!video) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }

    return NextResponse.json(video);
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to update video." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const deleted = await deleteVideo(id);

    if (!deleted) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete video." }, { status: 500 });
  }
}
