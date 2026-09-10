/**
 * Pull the JSON payload out of a Supabase MCP `execute_sql` transcript file and
 * write it as a clean, verifiable backup. Read-only against production.
 *
 * Usage: node scripts/extract-db-dump.mjs <transcript-file> <output.json>
 */
import { readFileSync, writeFileSync } from "node:fs";

const [transcriptPath, outputPath] = process.argv.slice(2);

if (!transcriptPath || !outputPath) {
  throw new Error(
    "Usage: node scripts/extract-db-dump.mjs <transcript-file> <output.json>",
  );
}

const file = readFileSync(transcriptPath, "utf8");

/** The transcript is either the raw tool text or a `{ "result": "…" }` envelope. */
function unwrapEnvelope(text) {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.result === "string") return parsed.result;
  } catch {
    // Not an envelope; fall through to the raw text.
  }
  return text;
}

const raw = unwrapEnvelope(file);

/**
 * The transcript wraps the rows in prose plus an `<untrusted-data-…>` fence.
 * The row array itself is the first `[{"dump":` … `}]` span, so locate it by
 * bracket matching rather than a regex that a nested brace could break.
 */
function extractRowArray(text) {
  const start = text.indexOf('[{"dump"');
  if (start === -1) {
    throw new Error("No `dump` column found in transcript.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "[" || char === "{") depth += 1;
    if (char === "]" || char === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }

  throw new Error("Unterminated row array in transcript.");
}

const rows = JSON.parse(extractRowArray(raw));
const dump = JSON.parse(rows[0].dump);

const counts = {
  site_content: dump.site_content?.length ?? 0,
  portfolio_library: dump.portfolio_library?.length ?? 0,
  site_content_revisions: dump.site_content_revisions?.length ?? 0,
  portfolio_library_revisions: dump.portfolio_library_revisions?.length ?? 0,
  storage_objects: dump.storage_objects?.length ?? 0,
};

if (counts.site_content === 0 || counts.storage_objects === 0) {
  throw new Error(`Refusing to write an incomplete dump: ${JSON.stringify(counts)}`);
}

writeFileSync(outputPath, `${JSON.stringify(dump, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
console.table(counts);
