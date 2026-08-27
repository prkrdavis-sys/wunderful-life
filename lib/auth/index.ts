export const ADMIN_COOKIE = "admin_session";

function normalizeAdminSecret(value: string): string {
  return value.normalize("NFC").replace(/^\uFEFF/, "").trim();
}

function configuredAdminPassword(): string {
  return normalizeAdminSecret(process.env.ADMIN_PASSWORD ?? "");
}

function comparableAdminSecret(value: string): string {
  return normalizeAdminSecret(value).toLowerCase();
}

function secretsMatch(received: string, expected: string): boolean {
  if (!received || received.length !== expected.length) return false;

  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ received.charCodeAt(index);
  }
  return mismatch === 0;
}

export function isAdminAuthRequired(): boolean {
  return configuredAdminPassword().length > 0;
}

export function adminSessionCookieValue(): string {
  return configuredAdminPassword();
}

export function canAccessAdmin(sessionValue: string | undefined): boolean {
  if (!isAdminAuthRequired()) return true;
  return secretsMatch(
    comparableAdminSecret(sessionValue ?? ""),
    comparableAdminSecret(configuredAdminPassword()),
  );
}

export function verifyAdminPassword(password: string): boolean {
  if (!isAdminAuthRequired()) return true;
  return secretsMatch(
    comparableAdminSecret(password),
    comparableAdminSecret(configuredAdminPassword()),
  );
}
