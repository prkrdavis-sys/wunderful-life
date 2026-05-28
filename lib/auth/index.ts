export const ADMIN_COOKIE = "admin_session";

export function isAdminAuthRequired(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.length);
}

export function canAccessAdmin(sessionValue: string | undefined): boolean {
  if (!isAdminAuthRequired()) return true;
  return sessionValue === process.env.ADMIN_PASSWORD;
}

export function verifyAdminPassword(password: string): boolean {
  if (!isAdminAuthRequired()) return true;
  return password === process.env.ADMIN_PASSWORD;
}
