import type { NextConfig } from "next";
import path from "node:path";

/**
 * R2 serves media from either the bucket's `pub-*.r2.dev` domain or a custom
 * domain, so the allowlist is derived from the configured public base URL.
 */
function r2RemotePattern(): { protocol: "https"; hostname: string }[] {
  const base = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (!base) return [];
  try {
    return [{ protocol: "https", hostname: new URL(base).hostname }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(process.cwd()),
  },
  images: {
    // WebP keeps PNG alpha intact in Safari. AVIF punches a black hole
    // through transparent device frames and logos.
    formats: ["image/webp"],
    // This site never needs 2K/4K variants; smaller srcset keeps HTML and
    // image optimization off the critical path.
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    // Hold optimized variants for 31 days. Each uploaded still is then pulled
    // from Supabase roughly once a month instead of on every page view, which
    // is what exhausted the free egress quota.
    minimumCacheTTL: 2_678_400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ltrldffckmplvmyonhwc.supabase.co",
        pathname: "/storage/v1/object/public/site-media/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/site-media/**",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      ...r2RemotePattern(),
    ],
  },
  experimental: {
    proxyClientMaxBodySize: "100mb",
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  headers: async () => [
    {
      source: "/admin/login",
      headers: [
        {
          key: "Cache-Control",
          value: "private, no-store, must-revalidate",
        },
      ],
    },
    {
      source: "/sw.js",
      headers: [
        {
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate",
        },
        {
          key: "Service-Worker-Allowed",
          value: "/",
        },
      ],
    },
    {
      source: "/manifest.webmanifest",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=0, must-revalidate",
        },
      ],
    },
    {
      source: "/uploads/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/:folder(plants|about-photos|brand|mockify|home-grid-photos|hero-photos|cta-photos|stats-photos|hero|butterfly)/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=86400, stale-while-revalidate=604800",
        },
      ],
    },
  ],
};

export default nextConfig;
