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

Update [`data/site.json`](data/site.json) for bio, tagline, services, and social links.

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

About photos uploaded locally are saved to `public/about-photos/` (committed to git) or **Vercel Blob** when `BLOB_READ_WRITE_TOKEN` is set on your Vercel project.

Video uploads still use local disk (`public/uploads/`), which does **not** persist on serverless hosts. For production video uploads, move storage to Vercel Blob or another remote bucket.

### Fix broken photos on Vercel

If photos work locally but show broken icons on Vercel, the image files were likely saved under `public/uploads/` (gitignored) and never deployed. Commit photos under `public/about-photos/` or enable Vercel Blob:

1. In the Vercel dashboard → Storage → Create Blob store
2. Link it to the project (sets `BLOB_READ_WRITE_TOKEN` automatically)
3. Redeploy

## Scripts

```bash
npm run dev    # development server
npm run build  # production build
npm run start  # production server
npm run lint   # ESLint
```

## Color palette

Green, blue, brown, yellow, pink, and cream — organic gradients, blob backgrounds, and wavy section dividers throughout.
