"use client";

import { useEffect, useRef, useState } from "react";
import { isQuickTimeVideoPath } from "@/lib/videos/upload";

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

/**
 * Chrome/Safari often decode <video> at CSS pixels, not device pixels, so a
 * 1080p clip in a 400px box looks 1x-soft on retina. Size the element at DPR
 * and scale it back so the decoder sees the extra pixels.
 */
function fitVideoToDisplaySize(
  video: HTMLVideoElement,
  container: HTMLElement,
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (width < 2 || height < 2) return;

  video.style.width = `${Math.round(width * dpr)}px`;
  video.style.height = `${Math.round(height * dpr)}px`;
  video.style.maxWidth = "none";
  video.style.maxHeight = "none";
  video.style.objectFit = "cover";
  video.style.transformOrigin = "0 0";
  video.style.transform =
    dpr === 1 ? "translateZ(0)" : `scale(${1 / dpr}) translateZ(0)`;
}

function primeInlineAutoplay(video: HTMLVideoElement, muted: boolean) {
  video.muted = muted;
  video.defaultMuted = muted;
  video.playsInline = true;
  video.autoplay = true;
  if (muted) {
    video.setAttribute("muted", "");
  } else {
    video.removeAttribute("muted");
  }
  video.setAttribute("autoplay", "");
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.setAttribute("x-webkit-airplay", "deny");
  video.disablePictureInPicture = true;
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
  const decodeFailedRef = useRef(false);
  const playInFlightRef = useRef(false);
  const [inView, setInView] = useState(eager);
  const [muted, setMuted] = useState(mutedProp);
  const [playing, setPlaying] = useState(false);
  const [hasFrame, setHasFrame] = useState(Boolean(poster));
  const [appliedSrc, setAppliedSrc] = useState(src);
  const [appliedPoster, setAppliedPoster] = useState(poster);
  const activeSrc = eager || inView ? src : null;
  const showCover = !playing;
  const hasPoster = Boolean(poster);
  const isQuickTime = isQuickTimeVideoPath(src);

  if (src !== appliedSrc || poster !== appliedPoster) {
    setAppliedSrc(src);
    setAppliedPoster(poster);
    setPlaying(false);
    setHasFrame(Boolean(poster));
  }

  useEffect(() => {
    decodeFailedRef.current = false;
    playInFlightRef.current = false;
  }, [src, poster]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    // Eager (hero) starts as in-view so play() is not gated on the first
    // IntersectionObserver tick. Safari/Chrome often report "hidden" or wait
    // until a scroll before delivering that callback.
    if (eager) {
      inViewRef.current = true;
    }

    let confirmedVisible = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible) {
          confirmedVisible = true;
          inViewRef.current = true;
          setInView(true);
          const video = videoRef.current;
          if (video && !decodeFailedRef.current) {
            primeInlineAutoplay(video, muted);
            void video.play().catch(() => undefined);
          }
          return;
        }
        if (!confirmedVisible) {
          return;
        }
        inViewRef.current = false;
        setInView(false);
        videoRef.current?.pause();
        setPlaying(false);
      },
      {
        rootMargin: eager ? "200px" : "80px",
        threshold: 0,
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [eager, muted, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;

    primeInlineAutoplay(video, muted);

    const captureFrame = () => {
      if (hasPoster) return;
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || video.videoWidth === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const drawWidth = Math.max(
        video.videoWidth,
        Math.round((container?.clientWidth || video.videoWidth) * dpr),
      );
      const drawHeight = Math.max(
        video.videoHeight,
        Math.round((container?.clientHeight || video.videoHeight) * dpr),
      );
      if (canvas.width !== drawWidth || canvas.height !== drawHeight) {
        canvas.width = drawWidth;
        canvas.height = drawHeight;
      }
      const context = canvas.getContext("2d");
      if (!context) return;
      try {
        context.drawImage(video, 0, 0, drawWidth, drawHeight);
        setHasFrame(true);
      } catch {
        // Cross-origin frames can fail; CSS still hides native play chrome.
      }
    };

    const canAttemptPlay = () =>
      inViewRef.current &&
      !decodeFailedRef.current &&
      document.visibilityState !== "hidden";

    const tryPlay = () => {
      if (!canAttemptPlay()) return;
      if (!video.paused || playInFlightRef.current) return;
      primeInlineAutoplay(video, muted);
      playInFlightRef.current = true;
      void video
        .play()
        .then(() => {
          playInFlightRef.current = false;
        })
        .catch(() => {
          playInFlightRef.current = false;
          setPlaying(false);
        });
    };

    const onLoaded = () => {
      captureFrame();
      tryPlay();
    };

    const onPlaying = () => setPlaying(true);

    const onPause = () => {
      captureFrame();
      if (canAttemptPlay()) {
        tryPlay();
        return;
      }
      setPlaying(false);
    };

    const onError = () => {
      decodeFailedRef.current = true;
      playInFlightRef.current = false;
      setPlaying(false);
    };

    tryPlay();
    const playAfterLayout = window.requestAnimationFrame(tryPlay);
    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("canplay", tryPlay);
    if (!isQuickTime) {
      video.addEventListener("canplaythrough", tryPlay);
    }
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", captureFrame);
    video.addEventListener("seeked", captureFrame);
    video.addEventListener("stalled", tryPlay);
    video.addEventListener("error", onError);
    document.addEventListener("visibilitychange", tryPlay);
    window.addEventListener("pageshow", tryPlay);
    window.addEventListener("touchstart", tryPlay, { passive: true });
    window.addEventListener("pointerdown", tryPlay);
    window.addEventListener("scroll", tryPlay, { passive: true });

    return () => {
      window.cancelAnimationFrame(playAfterLayout);
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("canplay", tryPlay);
      video.removeEventListener("canplaythrough", tryPlay);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", captureFrame);
      video.removeEventListener("seeked", captureFrame);
      video.removeEventListener("stalled", tryPlay);
      video.removeEventListener("error", onError);
      document.removeEventListener("visibilitychange", tryPlay);
      window.removeEventListener("pageshow", tryPlay);
      window.removeEventListener("touchstart", tryPlay);
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("scroll", tryPlay);
    };
  }, [activeSrc, hasPoster, isQuickTime, muted]);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const apply = () => fitVideoToDisplaySize(video, container);
    apply();
    const frame = window.requestAnimationFrame(apply);
    const observer = new ResizeObserver(apply);
    observer.observe(container);
    window.addEventListener("resize", apply);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, [activeSrc]);

  return (
    <div
      ref={containerRef}
      className={`autoplay-loop-clip absolute inset-0 h-full w-full overflow-hidden ${
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
        preload={eager ? "auto" : "metadata"}
        poster={poster}
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
          "autoplay-loop-video pointer-events-none absolute top-0 left-0 z-[1] object-cover",
          // iOS Safari will not decode a fully transparent <video>, so keep a
          // sliver of opacity until playback starts (poster/wallpaper cover it).
          playing ? "opacity-100" : "opacity-[0.01]",
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
          className={`pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover ${
            showCover ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
      {!hasPoster ? (
        <canvas
          ref={canvasRef}
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover ${
            showCover && hasFrame ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
      {showMuteToggle ? (
        <button
          type="button"
          onClick={() => {
            const video = videoRef.current;
            const nextMuted = !muted;
            setMuted(nextMuted);
            if (video) {
              primeInlineAutoplay(video, nextMuted);
              decodeFailedRef.current = false;
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
