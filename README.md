# Wunderful Life — UGC Portfolio

A colorful, organic UGC portfolio for Emily Wunder. Production copy and media
live in **Supabase**. Vercel only hosts the Next.js app.

## What is stored where

| Data | Production store |
|------|------------------|
| Site copy, photos, logos, hero video | Supabase Postgres `site_content` + Storage bucket `site-media` |
| Portfolio clips | Supabase Postgres `portfolio_library` + `site-media` |
| Version history | `site_content_revisions` and `portfolio_library_revisions` |
| Laptop backup only | [`data/site.json`](data/site.json) and [`data/videos.json`](data/videos.json) |

Those JSON files are **not** shown on Vercel. If the database is unreachable,
the live site fails visibly instead of swapping in placeholder copy.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase credentials, the app reads the bundled JSON files. With
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, local admin
edits write to the same database as production.

## Admin

1. Open **Menu → Admin** (password required when `ADMIN_PASSWORD` is set)
2. **Site** — copy, photos, logos, hero video
3. **Videos** — portfolio library
4. **Restore an earlier save** — rolls back to a previous version. The current
   save stays in history.

Media uploads go to Cloudflare R2 when it is configured, otherwise Supabase
Storage. Clips are converted to a web MP4 in the browser. QuickTime originals
are rejected if conversion fails. Uploaded stills over 600KB are re-compressed
before upload, to WebP when the source may carry transparency.

Photos and thumbnails are served through `/_next/image`, which caches optimized
WebP variants for 31 days. Serving the originals directly is what exhausted the
free Supabase egress quota.

## Environment

| Variable | Where | Description |
|----------|--------|-------------|
| `SUPABASE_URL` | Vercel Production (server only) | Project URL, e.g. `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel Production (server only) | Service role key. Never prefix with `NEXT_PUBLIC_` |
| `ADMIN_PASSWORD` | Vercel Production | Protects admin writes |
| `R2_ACCOUNT_ID` | Vercel Production (server only) | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Vercel Production (server only) | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | Vercel Production (server only) | R2 API token secret |
| `R2_BUCKET` | Vercel Production (server only) | Bucket name, e.g. `wunderful-media` |
| `R2_PUBLIC_BASE_URL` | Vercel Production | Public bucket origin, e.g. `https://pub-xxxx.r2.dev` |

All five R2 variables must be present together; any missing one falls back to
Supabase Storage. R2 charges nothing for egress, which is why media lives there.

Do **not** add `BLOB_READ_WRITE_TOKEN`. Media must not go back to Vercel Blob.

## Backup and media migration

Before any media change, snapshot everything. Both scripts are read-only
against production:

```bash
# 1. Export the content tables + revision history (via the Supabase MCP dump)
node scripts/extract-db-dump.mjs <mcp-dump.txt> backups/<date>/database.json
# 2. Download and byte-verify every file in the site-media bucket
node scripts/backup-media.mjs backups/<date>
```

To move media to R2 (copies only — Supabase keeps every original, so revision
history stays restorable):

```bash
node scripts/migrate-media-to-r2.mjs backups/<date>           # dry run
node scripts/migrate-media-to-r2.mjs backups/<date> --apply   # copy + verify
```

The script refuses to run on an incomplete backup, verifies each upload's byte
length, checks every file is publicly reachable from R2, then writes
`r2-repoint.sql` and `r2-rollback.sql` into the backup folder. Run the repoint
SQL to switch the live site over; run the rollback SQL to undo it.

## Deploy

Production needs the two Supabase variables above. After deploy, confirm:

- Admin banner says **Live from your saved site**
- Hero and portfolio videos play in Chrome (MP4)
- Photos load as WebP from `/_next/image`, not as multi-megabyte originals

One-time media repair (transcode leftover `.mov` files) if needed:

```bash
npx vercel env run -e production -- node scripts/repair-production-media.mjs
```

## Transfer to Emily's accounts

1. Create her Supabase project. **Pro ($25/mo)** is the professional default
   (100 GB storage, 250 GB egress, daily backups). Free is 5 GB + 5 GB egress
   and will fail the same way Blob did once videos get traffic.
2. Copy `site_content`, `portfolio_library`, both revision tables, and the
   `site-media` bucket (`supabase db dump` + Storage download, or dashboard
   backups).
3. Create or transfer the Vercel project under her team. Set
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a new `ADMIN_PASSWORD`
   that only she knows.
4. Add her custom domain.
5. In the old Vercel project: Storage → unlink Blob. Delete
   `BLOB_READ_WRITE_TOKEN` if it is still there.
6. After cutover, pause or delete the old Blob store so nothing is served
   from two places.

## Stability checklist

- Turn on usage emails in Supabase (egress + storage) and Vercel (Fast Data
  Transfer).
- Keep monthly JSON exports of `site_content` and `portfolio_library` in a
  folder she owns (Drive/Dropbox).
- Vercel Hobby is enough for this site once Blob is gone.
- If brand traffic grows, move video playback to Cloudflare Stream or Mux
  later. Supabase stays the CMS.

## Scripts

```bash
npm run dev    # development server
npm run build  # production build
npm run start  # production server
npm run lint   # ESLint
```

## Color palette

Green, blue, brown, yellow, pink, and cream — organic gradients and wavy
section dividers throughout.
