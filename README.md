# Wunderful Life — UGC Portfolio

A colorful, organic UGC portfolio built with Next.js, Framer Motion, and a local-first video admin flow.

## Features

- Landing page: Hero, About Me, Services, Work marquee, Contact
- Minimal artistic phone frames — still thumbnails until clicked, then inline video playback
- `/work` — drag carousel with platform and tag filters (including `/work?tag=…` deep links)
- `/work/[slug]` — full UGC metadata detail pages
- `/admin` — upload videos, edit metadata, reorder, feature for marquee
- Local JSON + disk storage via `lib/storage/local.ts`

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Editing placeholder copy

Update [`data/site.json`](data/site.json) for local development only. Production
site content is stored in the dedicated transactional database so admin saves
are versioned and cannot silently overwrite newer edits.

### Managing videos

1. Open **Menu → Admin** or visit `/admin`
2. Upload a video (mp4/webm) and thumbnail
3. Fill in UGC fields: brand, platform, hook, CTA, tags
4. Drag entries in the list to reorder; toggle **Featured** for the landing marquee

Seed demo entries live in [`data/videos.json`](data/videos.json). Upload thumbnails via Admin when ready.

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_PASSWORD` | _(unset)_ | When set, `/admin` and mutating `/api/videos` routes require login at `/admin/login` |

Without `ADMIN_PASSWORD`, admin routes are open for local development.

## Deploying with uploads

About photos and videos uploaded locally are saved to the local public folders.
Production media is stored in **Vercel Blob**, while the URLs and all other site
content are persisted in the dedicated transactional database.

### Fix broken photos on Vercel

If photos work locally but show broken icons on Vercel, the image files were likely saved under `public/uploads/` (gitignored) and never deployed. Commit photos under `public/about-photos/` or enable Vercel Blob:

1. In the Vercel dashboard → Storage → Create Blob store
2. Link it to the project (sets `BLOB_READ_WRITE_TOKEN` automatically)
3. Create the dedicated Supabase project and add these server-only Vercel
   environment variables for Production:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Redeploy

The service role key must never be prefixed with `NEXT_PUBLIC_` or exposed to
the browser. If the database credentials are missing or unavailable in
production, the app returns a storage error instead of falling back to the
checked-in `data/site.json`.

## Scripts

```bash
npm run dev    # development server
npm run build  # production build
npm run start  # production server
npm run lint   # ESLint
```

## Color palette

Green, blue, brown, yellow, pink, and cream — organic gradients, blob backgrounds, and wavy section dividers throughout.
