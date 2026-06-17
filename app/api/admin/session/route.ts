import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, canAccessAdmin, isAdminAuthRequired } from "@/lib/auth";

export async function GET() {
  const session = (await cookies()).get(ADMIN_COOKIE)?.value;
  const authenticated = canAccessAdmin(session);

  return NextResponse.json({
    authenticated,
    authRequired: isAdminAuthRequired(),
  });
}
