"use client";

import { useEffect, useRef, useState } from "react";

type AutoplayLoopVideoProps = {
  src: string;
  poster?: string;
  className?: string;
  muted?: boolean;
  showMuteToggle?: boolean;
  /** Start loading immediately. Use for above-the-fold hero video. */
  eager?: boolean;
  "aria-hidden"?: boolean;
  tabIndex?: number;
};

function isRemoteMediaUrl(src: string): boolean {
  return src.startsWith("https://") || src.startsWith("http://");
}

export function AutoplayLoopVideo({
  src,
  poster,
  className,
  muted: mutedProp = true,
  showMuteToggle = false,
  eager = false,
  "aria-hidden": ariaHidden,
  tabIndex,
}: AutoplayLoopVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inViewRef = useRef(eager);
  const [inView, setInView] = useState(eager);
  const [muted, setMuted] = useState(mutedProp);
  const [playing, setPlaying] = useState(false);
  const [hasFrame, setHasFrame] = useState(Boolean(poster));
  const [appliedSrc, setAppliedSrc] = useState(src);
  const [appliedPoster, setAppliedPoster] = useState(poster);
  const activeSrc = eager || inView ? src : null;
  const showCover = !playing;

  if (src !== appliedSrc || poster !== appliedPoster) {
    setAppliedSrc(src);
    setAppliedPoster(poster);
    setPlaying(false);
    setHasFrame(Boolean(poster));
  }

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        inViewRef.current = isVisible;
        setInView(isVisible);
        if (!isVisible) {
          videoRef.current?.pause();
          setPlaying(false);
        } else {
          void videoRef.current?.play().catch(() => undefined);
        }
      },
      {
        rootMargin: eager ? "400px" : "80px",
        threshold: 0.01,
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [eager]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;

    video.muted = muted;
    video.defaultMuted = muted;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.setAttribute("x-webkit-airplay", "deny");
    video.disablePictureInPicture = true;

    const captureFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas || video.videoWidth === 0) return;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      const context = canvas.getContext("2d");
      if (!context) return;
      try {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        setHasFrame(true);
      } catch {
        // Cross-origin frames can fail; CSS still hides native play chrome.
      }
    };

    const tryPlay = () => {
      if (!inViewRef.current) return;
      if (video.paused) void video.play().catch(() => undefined);
    };

    const onLoaded = () => {
      captureFrame();
      tryPlay();
    };

    const onPlaying = () => setPlaying(true);

    const onPause = () => {
      captureFrame();
      if (inViewRef.current) {
        void video.play().catch(() => setPlaying(false));
        return;
      }
      setPlaying(false);
    };

    tryPlay();
    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("loadedmetadata", captureFrame);
    video.addEventListener("canplay", tryPlay);
    video.addEventListener("canplaythrough", tryPlay);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", captureFrame);
    video.addEventListener("seeked", captureFrame);
    document.addEventListener("visibilitychange", tryPlay);
    document.addEventListener("pointerdown", tryPlay);

    return () => {
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("loadedmetadata", captureFrame);
      video.removeEventListener("canplay", tryPlay);
      video.removeEventListener("canplaythrough", tryPlay);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", captureFrame);
      video.removeEventListener("seeked", captureFrame);
      document.removeEventListener("visibilitychange", tryPlay);
      document.removeEventListener("pointerdown", tryPlay);
    };
  }, [activeSrc, muted]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 h-full w-full overflow-hidden ${
        eager ? "bg-black" : ""
      }`}
    >
      <video
        ref={videoRef}
        src={activeSrc ?? undefined}
        autoPlay
        muted={muted}
        loop
        playsInline
        preload="auto"
        {...{
          fetchPriority: eager ? "high" : "auto",
        }}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        crossOrigin={isRemoteMediaUrl(src) ? "anonymous" : undefined}
        tabIndex={tabIndex}
        aria-hidden={ariaHidden}
        className={[
          "autoplay-loop-video pointer-events-none",
          playing ? "opacity-100" : "opacity-0",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
      {poster ? (
        // Native img so this URL matches the layout preload (next/image would rewrite it).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          aria-hidden
          fetchPriority={eager ? "high" : "auto"}
          className={`pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover ${
            showCover ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover ${
          showCover && hasFrame && !poster ? "opacity-100" : "opacity-0"
        }`}
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
