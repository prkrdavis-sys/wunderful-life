"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { VideoThumbnail } from "@/components/ui/VideoThumbnail";
import type { PortfolioVideo } from "@/lib/videos/types";

type WorkPageClientProps = {
  initialVideos: PortfolioVideo[];
};

type WorkVideoCardProps = {
  video: PortfolioVideo;
};

function WorkVideoCard({ video }: WorkVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    void videoRef.current?.play().catch(() => undefined);
  }, [playing]);

  return (
    <article className="group relative w-full max-w-[320px] justify-self-center overflow-hidden rounded-[2rem] border border-white/55 bg-paper/76 p-3 shadow-xl shadow-pink/10 ring-1 ring-lavender/20 backdrop-blur-md transition hover:-translate-y-1 hover:border-pink/40 hover:shadow-pink/18">
      <div className="absolute -top-10 -right-8 h-24 w-24 rounded-full bg-pink/18 blur-2xl" />
      <div className="absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-lavender/24 blur-2xl" />

      <div className="relative aspect-[9/16] overflow-hidden rounded-[1.45rem] bg-brown/10">
        {playing ? (
          <video
            ref={videoRef}
            src={video.videoPath}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full bg-black object-cover"
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group/play relative h-full w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/45 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            aria-label={`Play ${video.title}`}
          >
            <VideoThumbnail
              src={video.thumbnailPath}
              alt={video.title}
              sizes="(max-width: 640px) 78vw, (max-width: 1024px) 42vw, 280px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brown/38 via-brown/5 to-white/10 transition group-hover/play:from-brown/30" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/45 bg-paper/26 text-pink-deep/90 shadow-lg shadow-burgundy/8 ring-1 ring-white/25 backdrop-blur-xl transition group-hover/play:scale-105 group-hover/play:bg-paper/38 group-hover/play:text-burgundy">
                <span className="translate-x-0.5 text-2xl leading-none">
                ▶
                </span>
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="relative px-2 pt-4 pb-2">
        <h2 className="font-display text-2xl leading-tight text-burgundy">
          {video.title || "Untitled video"}
        </h2>
        {video.brand.trim() && (
          <p className="mt-1 text-sm font-medium text-indigo/75">{video.brand}</p>
        )}
        {video.hook.trim() && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-brown/78">
            {video.hook}
          </p>
        )}

        <Link
          href={`/work/${video.slug}`}
          className="mt-5 inline-flex items-center rounded-full border border-burgundy/20 bg-pink/16 px-4 py-2 text-sm font-semibold text-burgundy transition hover:border-burgundy/35 hover:bg-pink/24"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}

export function WorkPageClient({ initialVideos }: WorkPageClientProps) {
  return (
    <div className="mt-12">
      {initialVideos.length === 0 ? (
        <p className="rounded-[2rem] border border-dashed border-burgundy/20 bg-paper/62 px-6 py-14 text-center text-muted shadow-lg shadow-pink/8 backdrop-blur-md">
          No videos yet. Check back soon for new work.
        </p>
      ) : (
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {initialVideos.map((video) => (
            <WorkVideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
