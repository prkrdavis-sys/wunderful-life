"use client";

import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PortfolioVideo } from "@/lib/videos/types";
import { uniqueVideosById } from "@/lib/videos/sort";
import { phoneTilt } from "./constants";
import { PhoneVideoPlayer } from "./PhoneVideoPlayer";

type CaptionClasses = {
  title?: string;
  brand?: string;
  link?: string;
};

type PhoneMarqueeProps = {
  videos: PortfolioVideo[];
  emptyClassName?: string;
  captionClasses?: CaptionClasses;
};

const INTERACTIVE_SELECTOR = "button, a, video, input, textarea, select, label";
const MIN_MARQUEE_SLIDES = 6;
const AUTO_SCROLL_SPEED = 0.45;

function buildMarqueeSlides(videos: PortfolioVideo[]): PortfolioVideo[] {
  if (videos.length === 0) return [];
  const repeats = Math.ceil(MIN_MARQUEE_SLIDES / videos.length);
  return Array.from({ length: repeats }, () => videos).flat();
}

function PhoneSlide({
  video,
  index,
  activeId,
  onActivate,
  captionClasses,
}: {
  video: PortfolioVideo;
  index: number;
  activeId: string | null;
  onActivate: (id: string | null) => void;
  captionClasses?: CaptionClasses;
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
        captionClasses={captionClasses}
      />
    </div>
  );
}

export function PhoneMarquee({
  videos,
  emptyClassName = "text-muted",
  captionClasses,
}: PhoneMarqueeProps) {
  const [activeSlideKey, setActiveSlideKey] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const uniqueVideos = useMemo(() => uniqueVideosById(videos), [videos]);
  const marqueeSlides = useMemo(() => buildMarqueeSlides(uniqueVideos), [uniqueVideos]);

  const watchDrag = useCallback((_emblaApi: unknown, event: MouseEvent | TouchEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return true;
    return !target.closest(INTERACTIVE_SELECTOR);
  }, []);

  const plugins = useMemo(
    () => [
      AutoScroll({
        speed: AUTO_SCROLL_SPEED,
        direction: "forward",
        playOnInit: true,
        startDelay: 0,
        stopOnInteraction: false,
        stopOnMouseEnter: false,
        stopOnFocusIn: false,
      }),
    ],
    [],
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      dragFree: true,
      watchDrag,
    },
    plugins,
  );

  const syncAutoScroll = useCallback(() => {
    const autoScroll = emblaApi?.plugins()?.autoScroll;
    if (!autoScroll) return;

    const shouldPause = Boolean(activeSlideKey) || isHovered;
    if (shouldPause) {
      autoScroll.stop();
    } else {
      autoScroll.play();
    }
  }, [emblaApi, activeSlideKey, isHovered]);

  useEffect(() => {
    syncAutoScroll();
  }, [syncAutoScroll]);

  useEffect(() => {
    if (!emblaApi) return;

    const onPointerDown = () => emblaApi.plugins()?.autoScroll?.stop();
    const onSettle = () => syncAutoScroll();

    emblaApi.on("pointerDown", onPointerDown);
    emblaApi.on("settle", onSettle);

    return () => {
      emblaApi.off("pointerDown", onPointerDown);
      emblaApi.off("settle", onSettle);
    };
  }, [emblaApi, syncAutoScroll]);

  if (uniqueVideos.length === 0) {
    return (
      <p className={`text-center ${emptyClassName}`}>
        No featured work yet — add videos in Admin.
      </p>
    );
  }

  return (
    <div className="relative py-4">
      <div
        ref={emblaRef}
        className="cursor-grab select-none overflow-hidden px-4 active:cursor-grabbing"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex gap-8 py-2">
          {marqueeSlides.map((video, index) => {
            const slideKey = `${video.id}-${index}`;
            const sourceIndex = index % uniqueVideos.length;

            return (
              <PhoneSlide
                key={slideKey}
                video={video}
                index={sourceIndex}
                activeId={activeSlideKey === slideKey ? video.id : null}
                onActivate={(id) => setActiveSlideKey(id ? slideKey : null)}
                captionClasses={captionClasses}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
