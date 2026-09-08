import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  adminSessionCookieValue,
  canAccessAdmin,
  verifyAdminPassword,
} from "./index.ts";

const originalAdminPassword = process.env.ADMIN_PASSWORD;

afterEach(() => {
  if (originalAdminPassword === undefined) {
    delete process.env.ADMIN_PASSWORD;
    return;
  }
  process.env.ADMIN_PASSWORD = originalAdminPassword;
});

test("accepts equivalent password text from different input methods", () => {
  process.env.ADMIN_PASSWORD = "  Wündérful  ";

  assert.equal(verifyAdminPassword("wündérful"), true);
  assert.equal(verifyAdminPassword("Wu\u0308nde\u0301rful"), true);
  assert.equal(verifyAdminPassword("\u200Bwündérful\uFEFF"), true);
  assert.equal(verifyAdminPassword("ｗÜＮＤÉＲＦＵＬ"), true);
});

test("rejects a genuinely different password", () => {
  process.env.ADMIN_PASSWORD = "Wündérful";

  assert.equal(verifyAdminPassword("Wündérfu1"), false);
});

test("stores a derived session token instead of the password", async () => {
  process.env.ADMIN_PASSWORD = "cookie-unsafe; password, with spaces";

  const session = await adminSessionCookieValue();

  assert.match(session, /^[a-f0-9]{64}$/);
  assert.equal(session.includes("cookie-unsafe"), false);
  assert.equal(await canAccessAdmin(session), true);
  assert.equal(await canAccessAdmin(process.env.ADMIN_PASSWORD), false);
});

test("changing the configured password invalidates existing sessions", async () => {
  process.env.ADMIN_PASSWORD = "first password";
  const oldSession = await adminSessionCookieValue();

  process.env.ADMIN_PASSWORD = "second password";

  assert.equal(await canAccessAdmin(oldSession), false);
});
