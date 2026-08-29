import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, canAccessAdmin, isAdminAuthRequired } from "@/lib/auth";

function isProtectedApiRoute(pathname: string, method: string): boolean {
  if (
    pathname.startsWith("/api/site/revisions") ||
    pathname.startsWith("/api/videos/revisions")
  ) {
    return true;
  }
  if (pathname.startsWith("/api/site")) {
    return method !== "GET";
  }
  if (!pathname.startsWith("/api/videos")) return false;
  if (method === "GET") return false;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isAdminAuthRequired()) {
    return NextResponse.next();
  }

  const session = request.cookies.get(ADMIN_COOKIE)?.value;

  if (isProtectedApiRoute(pathname, request.method) && !canAccessAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/videos/:path*",
    "/api/videos",
    "/api/site/:path*",
  ],
};
