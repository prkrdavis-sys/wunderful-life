"use client";

import { useState } from "react";
import type { PortfolioVideo } from "@/lib/videos/types";
import { phoneTilt } from "./constants";
import { PhoneVideoPlayer } from "./PhoneVideoPlayer";

type PhoneMarqueeProps = {
  videos: PortfolioVideo[];
};

export function PhoneMarquee({ videos }: PhoneMarqueeProps) {
  const [paused, setPaused] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  if (videos.length === 0) {
    return (
      <p className="text-center text-muted">
        No featured work yet — add videos in Admin.
      </p>
    );
  }

  const duplicated = [...videos, ...videos];

  const handleActivate = (id: string | null) => {
    setActiveId(id);
    setPaused(id !== null);
  };

  return (
    <div
      className="relative overflow-hidden py-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        if (!activeId) setPaused(false);
      }}
    >
      <div
        className={`marquee-track flex w-max gap-8 px-4 ${paused ? "paused" : ""}`}
      >
        {duplicated.map((video, index) => (
          <PhoneVideoPlayer
            key={`${video.id}-${index}`}
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
