export const ADMIN_COOKIE = "admin_session";

function normalizeAdminSecret(value: string): string {
  return value.normalize("NFC").replace(/^\uFEFF/, "").trim();
}

function configuredAdminPassword(): string {
  return normalizeAdminSecret(process.env.ADMIN_PASSWORD ?? "");
}

export function isAdminAuthRequired(): boolean {
  return configuredAdminPassword().length > 0;
}

export function canAccessAdmin(sessionValue: string | undefined): boolean {
  if (!isAdminAuthRequired()) return true;
  return normalizeAdminSecret(sessionValue ?? "") === configuredAdminPassword();
}

export function verifyAdminPassword(password: string): boolean {
  if (!isAdminAuthRequired()) return true;
  const expected = configuredAdminPassword();
  const received = normalizeAdminSecret(password);
  if (!received || received.length !== expected.length) return false;

  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ received.charCodeAt(index);
  }
  return mismatch === 0;
}
