import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Direct Blob uploads are disabled. Videos are saved to Supabase Storage through the admin API.",
    },
    { status: 410 },
  );
}
