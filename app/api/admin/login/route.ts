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

function setAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, adminSessionCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}

export async function POST(request: Request) {
  const password = await readPassword(request);
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!verifyAdminPassword(password)) {
    if (!isJson) {
      return NextResponse.redirect(new URL("/admin/login?error=1", request.url), 303);
    }
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  if (!isJson) {
    return setAdminCookie(
      NextResponse.redirect(new URL("/?admin=1", request.url), 303),
    );
  }

  return setAdminCookie(NextResponse.json({ success: true }));
}
