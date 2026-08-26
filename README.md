# Wunderful Life — UGC Portfolio

A colorful, organic UGC portfolio for Emily Wunder. Production copy and media
live in **Supabase**. Vercel only hosts the Next.js app.

## What is stored where

| Data | Production store |
|------|------------------|
| Site copy, photos, logos, hero/CTA videos | Supabase Postgres `site_content` + Storage bucket `site-media` |
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
2. **Site** — copy, photos, logos, hero/CTA video
3. **Videos** — portfolio library
4. **Restore an earlier save** — rolls back to a previous version. The current
   save stays in history.

Media uploads go straight to Supabase Storage. Clips are converted to a web
MP4 in the browser. QuickTime originals are rejected if conversion fails.

## Environment

| Variable | Where | Description |
|----------|--------|-------------|
| `SUPABASE_URL` | Vercel Production (server only) | Project URL, e.g. `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel Production (server only) | Service role key. Never prefix with `NEXT_PUBLIC_` |
| `ADMIN_PASSWORD` | Vercel Production | Protects admin writes |

Do **not** add `BLOB_READ_WRITE_TOKEN`. Media must not go back to Vercel Blob.

## Deploy

Production needs the two Supabase variables above. After deploy, confirm:

- Admin banner says **Live from your saved site**
- Hero and portfolio videos play in Chrome (MP4)
- Brand logos that still point at `blob.vercel-storage.com` are re-uploaded
  in Admin (two leftover Blob logos cannot be copied while Blob transfer is
  maxed)

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
