"use client";

import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PortfolioVideo } from "@/lib/videos/types";
import { uniqueVideosById } from "@/lib/videos/sort";
import { useAdminView } from "@/components/admin/AdminViewProvider";
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

/** Native controls that should keep their own pointer behavior. */
const INTERACTIVE_SELECTOR = "a, video, input, textarea, select, label";
/** Phone width (md) + gap — used to guarantee the track overflows the viewport. */
const ESTIMATED_SLIDE_WIDTH = 250;
/** Keep at least this many slides so short lists still feel like a marquee. */
const MIN_MARQUEE_SLIDES = 8;
/** Cap duplicated slides so we do not mount a dozen giant phone frames. */
const MAX_MARQUEE_SLIDES = 10;
/** Track should span this many viewport widths for seamless loop scrolling. */
const VIEWPORT_COVERAGE = 2.25;
const AUTO_SCROLL_SPEED = 0.45;

function slidesNeededForWidth(viewportWidth: number): number {
  const fromViewport = Math.ceil(
    (Math.max(viewportWidth, 320) * VIEWPORT_COVERAGE) / ESTIMATED_SLIDE_WIDTH,
  );
  return Math.min(
    MAX_MARQUEE_SLIDES,
    Math.max(MIN_MARQUEE_SLIDES, fromViewport),
  );
}

function buildMarqueeSlides(
  videos: PortfolioVideo[],
  minSlides: number,
): PortfolioVideo[] {
  if (videos.length === 0) return [];
  if (videos.length >= MAX_MARQUEE_SLIDES) return videos;
  const target = Math.min(
    MAX_MARQUEE_SLIDES,
    Math.max(minSlides, MIN_MARQUEE_SLIDES, videos.length),
  );
  const repeats = Math.ceil(target / videos.length);
  return Array.from({ length: repeats }, () => videos)
    .flat()
    .slice(0, Math.max(target, videos.length));
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
  const [marqueeInView, setMarqueeInView] = useState(false);
  // Desktop-first default so the first paint already overflows wide viewports.
  const [minSlides, setMinSlides] = useState(() => slidesNeededForWidth(1440));
  const { viewMode } = useAdminView();
  const uniqueVideos = useMemo(() => uniqueVideosById(videos), [videos]);
  const marqueeSlides = useMemo(
    () => buildMarqueeSlides(uniqueVideos, minSlides),
    [uniqueVideos, minSlides],
  );

  const watchDrag = useCallback((_emblaApi: unknown, event: MouseEvent | TouchEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return true;
    // Allow dragging from phone play buttons; Embla still distinguishes click vs drag.
    return !target.closest(INTERACTIVE_SELECTOR);
  }, []);

  const plugins = useMemo(
    () => [
      AutoScroll({
        speed: AUTO_SCROLL_SPEED,
        direction: "forward",
        playOnInit: false,
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

  const setViewportRef = useCallback(
    (node: HTMLDivElement | null) => {
      emblaRef(node);
    },
    [emblaRef],
  );

  useEffect(() => {
    const node = emblaApi?.rootNode();
    if (!node || typeof ResizeObserver === "undefined") return;

    const updateMinSlides = () => {
      setMinSlides(slidesNeededForWidth(node.clientWidth));
    };

    updateMinSlides();
    const observer = new ResizeObserver(updateMinSlides);
    observer.observe(node);
    return () => observer.disconnect();
  }, [emblaApi]);

  useEffect(() => {
    const node = emblaApi?.rootNode();
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setMarqueeInView(entries.some((entry) => entry.isIntersecting));
      },
      { rootMargin: "80px", threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
  }, [emblaApi, marqueeSlides.length]);

  const syncAutoScroll = useCallback(() => {
    const autoScroll = emblaApi?.plugins()?.autoScroll;
    if (!autoScroll) return;

    const shouldPause = Boolean(activeSlideKey) || isHovered || !marqueeInView;
    if (shouldPause) {
      autoScroll.stop();
    } else {
      autoScroll.play();
    }
  }, [emblaApi, activeSlideKey, isHovered, marqueeInView]);

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
    if (viewMode !== "admin") return null;
    return (
      <p className={`text-center ${emptyClassName}`}>
        No carousel videos yet — add videos in Admin.
      </p>
    );
  }

  return (
    <div className="relative min-h-[24rem] py-4 sm:min-h-[28rem]">
      <div
        ref={setViewportRef}
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
