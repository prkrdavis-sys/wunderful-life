import { NextResponse } from "next/server";
import { uploadAboutPhoto } from "@/lib/storage/site";
import { StorageError } from "@/lib/storage";

type RouteContext = {
  params: Promise<{ photoId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { photoId } = await context.params;
    const form = await request.formData();
    const file = form.get("photo");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Photo file is required." }, { status: 400 });
    }

    const site = await uploadAboutPhoto(photoId, file);
    return NextResponse.json(site);
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to upload photo." }, { status: 500 });
  }
}
