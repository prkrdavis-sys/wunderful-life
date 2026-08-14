"use client";

import { useEffect, useRef, useState } from "react";

type AutoplayLoopVideoProps = {
  src: string;
  className?: string;
  muted?: boolean;
  showMuteToggle?: boolean;
  /** Start loading immediately. Use for above-the-fold hero video. */
  eager?: boolean;
  "aria-hidden"?: boolean;
  tabIndex?: number;
};

export function AutoplayLoopVideo({
  src,
  className,
  muted: mutedProp = true,
  showMuteToggle = false,
  eager = false,
  "aria-hidden": ariaHidden,
  tabIndex,
}: AutoplayLoopVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(eager);
  const [muted, setMuted] = useState(mutedProp);
  const activeSrc = visible ? src : null;

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        setVisible(isVisible);
        if (!isVisible) videoRef.current?.pause();
      },
      { rootMargin: "80px", threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;

    video.muted = muted;
    video.defaultMuted = muted;
    video.playsInline = true;

    const tryPlay = () => {
      if (video.paused) void video.play().catch(() => undefined);
    };

    tryPlay();
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    document.addEventListener("visibilitychange", tryPlay);

    return () => {
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
      document.removeEventListener("visibilitychange", tryPlay);
    };
  }, [activeSrc, muted]);

  return (
    <div ref={containerRef} className="absolute inset-0 h-full w-full">
      <video
        ref={videoRef}
        src={activeSrc ?? undefined}
        autoPlay
        muted={muted}
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        disableRemotePlayback
        tabIndex={tabIndex}
        aria-hidden={ariaHidden}
        className={className}
      />
      {showMuteToggle ? (
        <button
          type="button"
          onClick={() => {
            const video = videoRef.current;
            const nextMuted = !muted;
            setMuted(nextMuted);
            if (video) {
              video.muted = nextMuted;
              void video.play().catch(() => undefined);
            }
          }}
          aria-pressed={!muted}
          className="absolute right-3 bottom-3 z-10 rounded-full border border-white/50 bg-forest-deep/70 px-3 py-1.5 font-label text-[11px] font-semibold tracking-[0.12em] text-paper uppercase backdrop-blur-md transition hover:bg-forest-deep"
        >
          {muted ? "Unmute" : "Mute"}
        </button>
      ) : null}
    </div>
  );
}
