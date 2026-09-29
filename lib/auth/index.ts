export const ADMIN_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const TOKEN_VERSION = "v1";

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

export function verifyAdminPassword(password: string): boolean {
  if (!isAdminAuthRequired()) return true;
  return secretsMatch(
    comparableAdminSecret(password),
    comparableAdminSecret(configuredAdminPassword()),
  );
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function signIssuedAt(issuedAt: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(comparableAdminSecret(configuredAdminPassword())),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${TOKEN_VERSION}.${issuedAt}`),
  );
  return toHex(signature);
}

function isFreshIssuedAt(issuedAt: string): boolean {
  const issuedAtMs = Number.parseInt(issuedAt, 36);
  if (!Number.isFinite(issuedAtMs)) return false;

  const ageSeconds = (Date.now() - issuedAtMs) / 1000;
  // Tolerate a little clock skew so a slightly-ahead client keeps its session.
  return ageSeconds > -300 && ageSeconds <= ADMIN_SESSION_MAX_AGE_SECONDS;
}

export async function adminSessionCookieValue(): Promise<string> {
  const issuedAt = Date.now().toString(36);
  return `${TOKEN_VERSION}.${issuedAt}.${await signIssuedAt(issuedAt)}`;
}

export async function canAccessAdmin(
  sessionValue: string | undefined,
): Promise<boolean> {
  if (!isAdminAuthRequired()) return true;

  const value = normalizeAdminSecret(sessionValue ?? "");
  if (!value) return false;

  const parts = value.split(".");
  if (parts.length === 3 && parts[0] === TOKEN_VERSION) {
    const [, issuedAt, signature] = parts;
    if (!isFreshIssuedAt(issuedAt)) return false;
    return secretsMatch(signature, await signIssuedAt(issuedAt));
  }

  // Sessions issued before signed tokens stored the password itself. Keep
  // accepting them so anyone already signed in is not logged out by this change.
  return secretsMatch(
    comparableAdminSecret(value),
    comparableAdminSecret(configuredAdminPassword()),
  );
}
