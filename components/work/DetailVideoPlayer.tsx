"use client";

import { useState } from "react";
import type { PortfolioVideo } from "@/lib/videos/types";
import { PhoneVideoPlayer } from "@/components/phone/PhoneVideoPlayer";

type DetailVideoPlayerProps = {
  video: PortfolioVideo;
};

export function DetailVideoPlayer({ video }: DetailVideoPlayerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="flex justify-center">
      <PhoneVideoPlayer
        video={video}
        size="lg"
        activeId={activeId}
        onActivate={setActiveId}
        showTitle={false}
        linkToDetail={false}
      />
    </div>
  );
}
