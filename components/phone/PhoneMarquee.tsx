"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import type { PortfolioVideo } from "@/lib/videos/types";
import { uniqueVideosById } from "@/lib/videos/sort";
import { phoneTilt } from "./constants";
import { PhoneVideoPlayer } from "./PhoneVideoPlayer";

type PhoneMarqueeProps = {
  videos: PortfolioVideo[];
  emptyClassName?: string;
};

const INTERACTIVE_SELECTOR = "button, a, video, input, textarea, select, label";

function initialSnapIndex(count: number): number {
  if (count <= 2) return 0;
  return Math.floor((count - 1) / 2);
}

function PhoneSlide({
  video,
  index,
  activeId,
  onActivate,
}: {
  video: PortfolioVideo;
  index: number;
  activeId: string | null;
  onActivate: (id: string | null) => void;
}) {
  return (
    <div className="min-w-0 shrink-0 grow-0 basis-auto">
      <PhoneVideoPlayer
        video={video}
        accentIndex={index % 5}
        tilt={phoneTilt(index)}
        size="md"
        activeId={activeId}
        onActivate={onActivate}
      />
    </div>
  );
}

export function PhoneMarquee({ videos, emptyClassName = "text-muted" }: PhoneMarqueeProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const uniqueVideos = uniqueVideosById(videos);

  const watchDrag = useCallback((_emblaApi: unknown, event: MouseEvent | TouchEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return true;
    return !target.closest(INTERACTIVE_SELECTOR);
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    containScroll: "trimSnaps",
    dragFree: true,
    watchDrag,
  });

  const syncScrollState = useCallback(() => {
    if (!emblaApi) return;
    const scrollable = emblaApi.canScrollPrev() || emblaApi.canScrollNext();
    setIsScrollable((prev) => (prev === scrollable ? prev : scrollable));
    return scrollable;
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const onReInit = () => {
      const scrollable = syncScrollState() ?? false;
      if (scrollable) {
        emblaApi.scrollTo(initialSnapIndex(uniqueVideos.length), true);
      } else {
        emblaApi.scrollTo(0, true);
      }
    };

    emblaApi.on("reInit", onReInit);
    queueMicrotask(onReInit);

    return () => {
      emblaApi.off("reInit", onReInit);
    };
  }, [emblaApi, uniqueVideos.length, syncScrollState]);

  if (uniqueVideos.length === 0) {
    return (
      <p className={`text-center ${emptyClassName}`}>
        No featured work yet — add videos in Admin.
      </p>
    );
  }

  if (uniqueVideos.length === 1) {
    return (
      <div className="flex justify-center px-4 py-6">
        <PhoneSlide
          video={uniqueVideos[0]}
          index={0}
          activeId={activeId}
          onActivate={setActiveId}
        />
      </div>
    );
  }

  return (
    <div className="relative py-4">
      <div
        ref={emblaRef}
        className={`overflow-hidden px-4 ${isScrollable ? "cursor-grab select-none active:cursor-grabbing" : ""}`}
      >
        <div className={`flex gap-8 py-2 ${!isScrollable ? "mx-auto w-max" : ""}`}>
          {uniqueVideos.map((video, index) => (
            <PhoneSlide
              key={video.id}
              video={video}
              index={index}
              activeId={activeId}
              onActivate={setActiveId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
