import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { clearBrandLogo, uploadBrandLogo } from "@/lib/storage/site";
import { StorageError } from "@/lib/storage";

type RouteContext = {
  params: Promise<{ brandId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { brandId } = await context.params;
    const form = await request.formData();
    const file = form.get("photo");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Logo file is required." }, { status: 400 });
    }

    const site = await uploadBrandLogo(brandId, file);
    revalidatePath("/", "layout");
    return NextResponse.json(site);
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to upload logo." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { brandId } = await context.params;
    const site = await clearBrandLogo(brandId);
    revalidatePath("/", "layout");
    return NextResponse.json(site);
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to remove logo." }, { status: 500 });
  }
}
