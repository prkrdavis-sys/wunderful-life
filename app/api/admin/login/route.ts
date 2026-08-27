import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminSessionCookieValue,
  verifyAdminPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

async function readPassword(request: Request): Promise<string> {
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { password?: unknown };
      return typeof body.password === "string" ? body.password : "";
    }

    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await request.formData();
      const value = form.get("password");
      return typeof value === "string" ? value : "";
    }
  } catch {
    return "";
  }

  return "";
}

export async function POST(request: Request) {
  const password = await readPassword(request);

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, adminSessionCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}
