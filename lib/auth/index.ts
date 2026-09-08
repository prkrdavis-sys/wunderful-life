export const ADMIN_COOKIE = "admin_session";

function normalizeAdminSecret(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\p{Cf}/gu, "")
    .trim()
    .toLowerCase();
}

function configuredAdminPassword(): string {
  return normalizeAdminSecret(process.env.ADMIN_PASSWORD ?? "");
}

function secretsMatch(received: string, expected: string): boolean {
  const receivedBytes = new TextEncoder().encode(received);
  const expectedBytes = new TextEncoder().encode(expected);
  if (!receivedBytes.length || receivedBytes.length !== expectedBytes.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < expectedBytes.length; index += 1) {
    mismatch |= expectedBytes[index] ^ receivedBytes[index];
  }
  return mismatch === 0;
}

export function isAdminAuthRequired(): boolean {
  return configuredAdminPassword().length > 0;
}

async function adminSessionCookieValue(): Promise<string> {
  const password = configuredAdminPassword();
  if (!password) return "";

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode("wunderful-life:admin-session:v1"),
  );
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function canAccessAdmin(
  sessionValue: string | undefined,
): Promise<boolean> {
  if (!isAdminAuthRequired()) return true;
  return secretsMatch(sessionValue ?? "", await adminSessionCookieValue());
}

export function verifyAdminPassword(password: string): boolean {
  if (!isAdminAuthRequired()) return true;
  return secretsMatch(normalizeAdminSecret(password), configuredAdminPassword());
}

export { adminSessionCookieValue };
