import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { setHeroVideoUrl, uploadHeroVideo } from "@/lib/storage/site";
import { StorageError } from "@/lib/storage";
import { isAcceptedVideoFile, videoUploadErrorMessage } from "@/lib/videos/upload";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const videoUrl = form.get("videoUrl");
    const file = form.get("video");

    if (typeof videoUrl === "string" && videoUrl.startsWith("https://")) {
      const site = await setHeroVideoUrl(videoUrl);
      revalidatePath("/", "layout");
      return NextResponse.json(site);
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

    const site = await uploadHeroVideo(file);
    revalidatePath("/", "layout");
    return NextResponse.json(site);
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
