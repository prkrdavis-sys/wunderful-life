"use client";

import { useCallback, useEffect, useState } from "react";
import { AutoplayLoopVideo } from "@/components/ui/AutoplayLoopVideo";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { sectionWallpapers } from "@/lib/plants";
import type { MediaIntrinsicSize, VideoObjectFit } from "@/lib/videos/cover-fit";

type MeasuredMedia = {
  sourceKey: string;
  size: MediaIntrinsicSize;
};

function usePortraitOrientation() {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(orientation: portrait)");
    const sync = () => setIsPortrait(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isPortrait;
}

function ratioPaddingTop(size: MediaIntrinsicSize): string {
  if (size.width < 1) return "177.78%";
  return `${(size.height / size.width) * 100}%`;
}

function HeroBackgroundVideo({
  src,
  poster,
  fit,
  onIntrinsicSize,
}: {
  src: string;
  poster?: string;
  fit: VideoObjectFit;
  onIntrinsicSize: (size: MediaIntrinsicSize) => void;
}) {
  return (
    <AutoplayLoopVideo
      src={src}
      poster={poster}
      muted
      aria-hidden
      tabIndex={-1}
      fit={fit}
      onIntrinsicSize={onIntrinsicSize}
      className="pointer-events-none"
    />
  );
}

export function HeroVideoSection() {
  const site = useSiteContent();
  const { wallpaper, overlay } = sectionWallpapers.hero;
  const videoPath = site.hero.videoPath;
  const posterPath = site.hero.posterPath;
  const hasVideo = Boolean(videoPath);
  const hasPoster = Boolean(posterPath);
  const mediaSourceKey = `${videoPath ?? ""}\u0000${posterPath ?? ""}`;
  const [mediaSize, setMediaSize] = useState<MeasuredMedia | null>(null);
  const mediaSizeForSource =
    mediaSize?.sourceKey === mediaSourceKey ? mediaSize.size : null;

  const onIntrinsicSize = useCallback(
    (size: MediaIntrinsicSize) => {
      setMediaSize((current) => {
        if (
          current?.sourceKey === mediaSourceKey &&
          current.size.width === size.width &&
          current.size.height === size.height
        ) {
          return current;
        }
        return { sourceKey: mediaSourceKey, size };
      });
    },
    [mediaSourceKey],
  );

  const isPortraitOrientation = usePortraitOrientation();
  const knownLandscape = Boolean(
    mediaSizeForSource &&
      mediaSizeForSource.width >= mediaSizeForSource.height,
  );
  // Portrait clips keep their full frame on phones. On a wide desktop the
  // same exact-ratio box is thousands of pixels tall and looks empty.
  const useExactRatio = Boolean(
    hasVideo && isPortraitOrientation && !knownLandscape,
  );
  const videoFit: VideoObjectFit = useExactRatio ? "contain" : "cover";
  const sizerSize = mediaSizeForSource ?? { width: 9, height: 16 };

  return (
    <section
      className="hero-video-band relative z-20 w-full overflow-hidden bg-forest-deep"
      data-exact={useExactRatio ? "true" : "false"}
      data-has-ratio={hasVideo ? "true" : "false"}
    >
      {/*
        In-flow padding-top box. A grid item with aspect-ratio is ignored in
        Safari, which left vertical clips in an 85svh cover frame and cropped
        the top and bottom.
      */}
      <div className="hero-video-sizers w-full min-w-0">
        {hasVideo ? (
          <div
            aria-hidden
            className="hero-video-sizer-exact w-full"
            style={{
              ["--hero-ratio-padding" as string]: ratioPaddingTop(sizerSize),
            }}
          />
        ) : null}
        <div
          aria-hidden
          className="hero-video-sizer-cover w-full min-h-[85svh]"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-0">
        <PlantSectionBackground
          wallpaper={wallpaper}
          overlay={hasVideo && hasPoster ? "none" : overlay}
        />
        {hasVideo && videoPath ? (
          <HeroBackgroundVideo
            src={videoPath}
            poster={posterPath}
            fit={videoFit}
            onIntrinsicSize={onIntrinsicSize}
          />
        ) : null}
      </div>
    </section>
  );
}
