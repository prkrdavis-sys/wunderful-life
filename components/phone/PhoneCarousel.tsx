"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useState } from "react";
import type { PortfolioVideo } from "@/lib/videos/types";
import { uniqueVideosById } from "@/lib/videos/sort";
import { phoneTilt } from "./constants";
import { PhoneVideoPlayer } from "./PhoneVideoPlayer";

type PhoneCarouselProps = {
  videos: PortfolioVideo[];
  size?: "md" | "lg";
};

export function PhoneCarousel({ videos, size = "lg" }: PhoneCarouselProps) {
  const uniqueVideos = uniqueVideosById(videos);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;

    const updateScrollState = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    emblaApi.on("select", updateScrollState);
    emblaApi.on("reInit", updateScrollState);
    queueMicrotask(updateScrollState);

    return () => {
      emblaApi.off("select", updateScrollState);
      emblaApi.off("reInit", updateScrollState);
    };
  }, [emblaApi]);

  if (uniqueVideos.length === 0) {
    return (
      <p className="py-16 text-center text-muted">
        No videos match your filters.
      </p>
    );
  }

  return (
    <div className="relative">
      <div className="mb-4 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canScrollPrev}
          className="rounded-full border-2 border-white/50 bg-white/25 px-4 py-2 text-sm font-medium text-indigo backdrop-blur-sm disabled:opacity-30"
          aria-label="Previous videos"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canScrollNext}
          className="rounded-full border-2 border-white/50 bg-white/25 px-4 py-2 text-sm font-medium text-indigo backdrop-blur-sm disabled:opacity-30"
          aria-label="Next videos"
        >
          →
        </button>
      </div>

      <div ref={emblaRef} className="overflow-hidden px-4">
        <div className="flex gap-6 py-6">
          {uniqueVideos.map((video, index) => (
            <div key={video.id} className="min-w-0 shrink-0 grow-0 basis-auto">
              <PhoneVideoPlayer
                video={video}
                accentIndex={index}
                tilt={phoneTilt(index)}
                size={size}
                activeId={activeId}
                onActivate={setActiveId}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
