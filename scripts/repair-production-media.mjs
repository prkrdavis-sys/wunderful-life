/**
 * One-time repair: copy leftover Vercel Blob logos into Supabase Storage
 * and transcode live .mov videos to web MP4. Does not start Next.js.
 */
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static");

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function loadEnvFile(name) {
  const path = join(root, name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile("scripts/.env.repair.local");
loadEnvFile(".env.local");
loadEnvFile(".env");

function normalizeSupabaseUrl(raw) {
  return raw.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, "");
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;
const accessKey =
  serviceRoleKey &&
  !serviceRoleKey.includes("[SENSITIVE]") &&
  serviceRoleKey.length > 20
    ? serviceRoleKey
    : anonKey;
if (
  !supabaseUrl ||
  !accessKey ||
  !/^https?:\/\//i.test(supabaseUrl) ||
  supabaseUrl.includes("[SENSITIVE]")
) {
  throw new Error(
    "SUPABASE_URL plus SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY are required.",
  );
}

const canWriteDatabase = Boolean(
  serviceRoleKey &&
    !serviceRoleKey.includes("[SENSITIVE]") &&
    serviceRoleKey.length > 20,
);

const supabase = createClient(normalizeSupabaseUrl(supabaseUrl), accessKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = "site-media";
const workDir = join(tmpdir(), `wunderful-repair-${randomUUID()}`);
mkdirSync(workDir, { recursive: true });

function ffmpegBin() {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static did not provide a binary path.");
  }
  return ffmpegPath;
}

async function download(url, dest) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed ${response.status} for ${url}`);
  }
  writeFileSync(dest, Buffer.from(await response.arrayBuffer()));
}

function publicUrl(path) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function uploadFile(objectPath, filePath, contentType) {
  const bytes = readFileSync(filePath);
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return publicUrl(objectPath);
}

function transcode(inputPath, outputPath, profile) {
  const bin = ffmpegBin();
  const maxShort = profile === "hero" ? 1080 : 720;
  const crf = profile === "hero" ? "23" : "26";
  const args = [
    "-y",
    "-i",
    inputPath,
    "-map",
    "0:v:0",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    crf,
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-vf",
    `scale=iw*sar:ih,setsar=1,scale='if(gte(iw,ih),-2,min(iw,${maxShort}))':'if(gt(ih,iw),-2,min(ih,${maxShort}))',scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1`,
  ];
  if (profile === "hero") {
    args.push("-an");
  } else {
    args.push("-map", "0:a:0?", "-c:a", "aac", "-b:a", "128k");
  }
  if (profile === "hero") args.push("-t", "60");
  if (profile === "portfolio") args.push("-t", "120");
  args.push(outputPath);
  execFileSync(bin, args, { stdio: "inherit" });
}

function replaceUrl(value, from, to) {
  if (typeof value !== "string") return value;
  return value === from ? to : value;
}

function walkReplace(value, from, to) {
  if (Array.isArray(value)) {
    return value.map((item) => walkReplace(item, from, to));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        walkReplace(item, from, to),
      ]),
    );
  }
  return replaceUrl(value, from, to);
}

async function migrateBlobLogos(site) {
  const logos = (site.brands?.items ?? [])
    .map((item) => item.logoPath)
    .filter(
      (url) => typeof url === "string" && url.includes("blob.vercel-storage.com"),
    );

  let next = site;
  for (const url of logos) {
    const dest = join(
      workDir,
      `logo-${createHash("sha1").update(url).digest("hex").slice(0, 8)}.png`,
    );
    try {
      await download(url, dest);
    } catch (error) {
      console.warn(`Could not download Blob logo (quota or missing): ${url}`);
      console.warn(error instanceof Error ? error.message : error);
      continue;
    }
    const objectPath = `brand-logos/${randomUUID()}.png`;
    const uploaded = await uploadFile(objectPath, dest, "image/png");
    next = walkReplace(next, url, uploaded);
    console.log(`Moved logo ${url} -> ${uploaded}`);
  }
  return next;
}

async function transcodeIfMov(url, profile) {
  if (!url || !url.toLowerCase().includes(".mov")) return url;
  const dest = join(workDir, `${randomUUID()}.mov`);
  const out = join(workDir, `${randomUUID()}.mp4`);
  console.log(`Downloading ${profile} ${url}`);
  await download(url, dest);
  console.log(`Transcoding ${profile}…`);
  transcode(dest, out, profile);
  const folder = profile === "hero" ? "hero" : "videos";
  const objectPath = `${folder}/${randomUUID()}.mp4`;
  const uploaded = await uploadFile(objectPath, out, "video/mp4");
  console.log(`${url} -> ${uploaded}`);
  return uploaded;
}

async function main() {
  const sourcePath = join(root, "scripts/repair-source.json");
  const jobsPath = join(root, "scripts/repair-jobs.json");
  if (existsSync(jobsPath) && !existsSync(sourcePath)) {
    const jobs = JSON.parse(readFileSync(jobsPath, "utf8"));
    const replacements = [];
    for (const job of jobs) {
      if (job.kind === "blob-logo") {
        const dest = join(
          workDir,
          `logo-${createHash("sha1").update(job.url).digest("hex").slice(0, 8)}.png`,
        );
        try {
          await download(job.url, dest);
          const uploaded = await uploadFile(
            `brand-logos/${randomUUID()}.png`,
            dest,
            "image/png",
          );
          replacements.push({ from: job.url, to: uploaded, id: job.id });
          console.log(`Moved logo ${job.url} -> ${uploaded}`);
        } catch (error) {
          console.warn(`Could not move Blob logo: ${job.url}`);
          console.warn(error instanceof Error ? error.message : error);
        }
        continue;
      }
      const next = await transcodeIfMov(job.url, job.profile);
      replacements.push({ from: job.url, to: next, id: job.id });
    }
    writeFileSync(
      join(root, "scripts/repair-url-map.json"),
      `${JSON.stringify({ replacements }, null, 2)}\n`,
    );
    console.log("Wrote scripts/repair-url-map.json");
    return;
  }

  let siteRow;
  let libraryRow;
  if (existsSync(sourcePath)) {
    const source = JSON.parse(readFileSync(sourcePath, "utf8"));
    siteRow = { content: source.site, version: source.siteVersion };
    libraryRow = { videos: source.videos, version: source.libraryVersion };
  } else {
    const { data, error: siteError } = await supabase
      .from("site_content")
      .select("content, version")
      .eq("id", "singleton")
      .single();
    if (siteError) throw siteError;
    siteRow = data;

    const library = await supabase
      .from("portfolio_library")
      .select("videos, version")
      .eq("id", "singleton")
      .single();
    if (library.error) throw library.error;
    libraryRow = library.data;
  }

  let site = siteRow.content;
  site = await migrateBlobLogos(site);

  if (site.hero?.videoPath) {
    site = {
      ...site,
      hero: {
        ...site.hero,
        videoPath: await transcodeIfMov(site.hero.videoPath, "hero"),
      },
    };
  }
  const videos = [];
  for (const video of libraryRow.videos ?? []) {
    videos.push({
      ...video,
      videoPath: await transcodeIfMov(video.videoPath, "portfolio"),
    });
  }

  const mapping = {
    siteVersion: siteRow.version,
    libraryVersion: libraryRow.version,
    site,
    videos,
  };
  writeFileSync(
    join(root, "scripts/repair-url-map.json"),
    `${JSON.stringify(mapping, null, 2)}\n`,
  );

  if (!canWriteDatabase) {
    console.log(
      "Uploaded media and wrote scripts/repair-url-map.json. Apply the JSON through the database (service role / MCP).",
    );
    return;
  }

  const { error: saveSiteError } = await supabase.rpc("save_site_content", {
    expected_version: siteRow.version,
    next_content: site,
    actor: "repair",
  });
  if (saveSiteError) throw saveSiteError;

  const { error: saveLibraryError } = await supabase.rpc(
    "save_portfolio_library",
    {
      expected_version: libraryRow.version,
      next_videos: videos,
      actor: "repair",
    },
  );
  if (saveLibraryError) throw saveLibraryError;

  console.log("Production media repair complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    rmSync(workDir, { recursive: true, force: true });
  });
