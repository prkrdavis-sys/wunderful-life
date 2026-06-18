import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, canAccessAdmin, isAdminAuthRequired } from "@/lib/auth";

function isProtectedApiRoute(pathname: string, method: string): boolean {
  if (pathname === "/api/videos/upload") {
    return false;
  }
  if (pathname.startsWith("/api/site")) {
    return method !== "GET";
  }
  if (!pathname.startsWith("/api/videos")) return false;
  if (method === "GET") return false;
  return true;
}

function isProtectedAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function middleware(request: NextRequest) {
  if (!isAdminAuthRequired()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const session = request.cookies.get(ADMIN_COOKIE)?.value;

  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    if (canAccessAdmin(session)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  const needsAuth =
    isProtectedAdminRoute(pathname) || isProtectedApiRoute(pathname, request.method);

  if (needsAuth && !canAccessAdmin(session)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/videos/:path*", "/api/videos", "/api/site/:path*"],
};
