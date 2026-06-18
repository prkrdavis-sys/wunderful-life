"use client";

import { useState } from "react";
import type { PortfolioVideo } from "@/lib/videos/types";
import { uniqueVideosById } from "@/lib/videos/sort";
import { phoneTilt } from "./constants";
import { PhoneVideoPlayer } from "./PhoneVideoPlayer";

type PhoneMarqueeProps = {
  videos: PortfolioVideo[];
  emptyClassName?: string;
};

export function PhoneMarquee({ videos, emptyClassName = "text-muted" }: PhoneMarqueeProps) {
  const [paused, setPaused] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const uniqueVideos = uniqueVideosById(videos);

  if (uniqueVideos.length === 0) {
    return (
      <p className={`text-center ${emptyClassName}`}>
        No featured work yet — add videos in Admin.
      </p>
    );
  }

  const handleActivate = (id: string | null) => {
    setActiveId(id);
    setPaused(id !== null);
  };

  const shouldAnimate = uniqueVideos.length > 1;

  return (
    <div
      className="relative overflow-hidden py-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        if (!activeId) setPaused(false);
      }}
    >
      <div
        className={`flex w-max gap-8 px-4 ${
          shouldAnimate ? `marquee-track-single ${paused ? "paused" : ""}` : "mx-auto"
        }`}
      >
        {uniqueVideos.map((video, index) => (
          <PhoneVideoPlayer
            key={video.id}
            video={video}
            accentIndex={index % 5}
            tilt={phoneTilt(index)}
            size="md"
            activeId={activeId}
            onActivate={handleActivate}
          />
        ))}
      </div>
    </div>
  );
}
