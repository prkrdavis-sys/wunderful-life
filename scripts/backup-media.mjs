/**
 * Download every object in the public `site-media` bucket and verify each file
 * against the size recorded in the database dump. Read-only: nothing is
 * uploaded, moved, or deleted.
 *
 * Usage: node scripts/backup-media.mjs backups/<date>
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const backupDir = process.argv[2];

if (!backupDir) {
  throw new Error("Usage: node scripts/backup-media.mjs backups/<date>");
}

const PROJECT_URL = "https://ltrldffckmplvmyonhwc.supabase.co";
const BUCKET = "site-media";
const CONCURRENCY = 5;

const dump = JSON.parse(readFileSync(join(backupDir, "database.json"), "utf8"));
const objects = dump.storage_objects;
const mediaDir = join(backupDir, "media");

function publicUrl(name) {
  const encoded = name.split("/").map(encodeURIComponent).join("/");
  return `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/${encoded}`;
}

async function downloadOne(object) {
  const target = join(mediaDir, object.name);
  const expected = Number(object.size);

  try {
    if (statSync(target).size === expected) {
      return { name: object.name, status: "already-present", bytes: expected };
    }
  } catch {
    // Not downloaded yet.
  }

  const response = await fetch(publicUrl(object.name));
  if (!response.ok) {
    return {
      name: object.name,
      status: `FAILED http ${response.status}`,
      bytes: 0,
    };
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length !== expected) {
    return {
      name: object.name,
      status: `FAILED size ${bytes.length} != ${expected}`,
      bytes: bytes.length,
    };
  }

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes);

  return {
    name: object.name,
    status: "downloaded",
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

const queue = [...objects];
const results = [];

async function worker() {
  for (let next = queue.shift(); next; next = queue.shift()) {
    const result = await downloadOne(next);
    results.push(result);
    if (result.status.startsWith("FAILED")) {
      console.error(`✗ ${result.name} — ${result.status}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const failed = results.filter((r) => r.status.startsWith("FAILED"));
const totalBytes = results.reduce((sum, r) => sum + r.bytes, 0);

writeFileSync(
  join(backupDir, "media-manifest.json"),
  `${JSON.stringify(
    { verifiedAt: new Date().toISOString(), files: results.sort((a, b) => a.name.localeCompare(b.name)) },
    null,
    2,
  )}\n`,
);

console.log(
  `${results.length - failed.length}/${objects.length} files verified, ${(totalBytes / 1024 / 1024).toFixed(1)} MB`,
);

if (failed.length > 0) {
  throw new Error(`${failed.length} file(s) failed to back up.`);
}
