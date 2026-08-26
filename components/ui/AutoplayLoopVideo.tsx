"use client";

import { useEffect, useRef, useState } from "react";
import {
  containFitForVideo,
  coverFitForVideo,
  stillCanvasSize,
  type MediaIntrinsicSize,
  type VideoObjectFit,
} from "@/lib/videos/cover-fit";

type AutoplayLoopVideoProps = {
  src: string;
  poster?: string;
  className?: string;
  muted?: boolean;
  showMuteToggle?: boolean;
  /** Start loading immediately. Use for above-the-fold hero video. */
  eager?: boolean;
  /** Safari-safe box fit. Cover fills and may crop; contain never crops. */
  fit?: VideoObjectFit;
  onIntrinsicSize?: (size: MediaIntrinsicSize) => void;
  "aria-hidden"?: boolean;
  tabIndex?: number;
};

function isRemoteMediaUrl(src: string): boolean {
  return src.startsWith("https://") || src.startsWith("http://");
}

function shouldLoadDecorativeVideo() {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (!connection) return true;
  if (connection.saveData) return false;
  return connection.effectiveType !== "slow-2g" && connection.effectiveType !== "2g";
}

function scheduleIdle(callback: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    const idleId = window.requestIdleCallback(callback, { timeout: 2200 });
    return () => window.cancelIdleCallback(idleId);
  }
  const timeoutId = window.setTimeout(callback, 800);
  return () => window.clearTimeout(timeoutId);
}

function applyCssObjectFit(video: HTMLVideoElement, fit: VideoObjectFit) {
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.maxWidth = "";
  video.style.maxHeight = "";
  video.style.inset = "0";
  video.style.objectFit = fit;
  video.style.objectPosition = "center";
  video.style.transformOrigin = "center center";
  video.style.transform = "translateZ(0)";
}

function mediaFitForVideo(
  options: Parameters<typeof coverFitForVideo>[0],
  fit: VideoObjectFit,
) {
  switch (fit) {
    case "cover":
      return coverFitForVideo(options);
    case "contain":
      return containFitForVideo(options);
    default: {
      const _exhaustive: never = fit;
      return _exhaustive;
    }
  }
}

/**
 * Fit the box at the clip's real ratio. Sizing the <video> to the
 * container's aspect (then relying on object-fit) stretches on Safari —
 * portrait lifestyle clips become a wide, flattened still.
 */
function fitVideoToDisplaySize(
  video: HTMLVideoElement,
  container: HTMLElement,
  objectFit: VideoObjectFit,
) {
  const width = container.clientWidth;
  const height = container.clientHeight;
  const fit = mediaFitForVideo(
    {
      sourceWidth: video.videoWidth,
      sourceHeight: video.videoHeight,
      containerWidth: width,
      containerHeight: height,
      devicePixelRatio: window.devicePixelRatio || 1,
      // Full-viewport heroes do not need 3x decode; that stalls first paint.
      maxDevicePixelRatio: width * height > 400_000 ? 1.25 : 2,
    },
    objectFit,
  );
  if (!fit) {
    applyCssObjectFit(video, objectFit);
    return;
  }

  video.style.width = `${fit.width}px`;
  video.style.height = `${fit.height}px`;
  video.style.maxWidth = "none";
  video.style.maxHeight = "none";
  video.style.left = `${fit.left}px`;
  video.style.top = `${fit.top}px`;
  video.style.right = "auto";
  video.style.bottom = "auto";
  video.style.objectFit = "fill";
  video.style.objectPosition = "center";
  video.style.transformOrigin = "0 0";
  video.style.transform =
    fit.scale === 1 ? "translateZ(0)" : `scale(${fit.scale}) translateZ(0)`;
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
  fit = "cover",
  onIntrinsicSize,
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
  const [idleReady, setIdleReady] = useState(eager);
  const [muted, setMuted] = useState(mutedProp);
  const [playing, setPlaying] = useState(false);
  const [hasFrame, setHasFrame] = useState(Boolean(poster));
  const [appliedSrc, setAppliedSrc] = useState(src);
  const [appliedPoster, setAppliedPoster] = useState(poster);
  const activeSrc = (eager || (idleReady && inView)) ? src : null;
  const showCover = !playing;
  const hasPoster = Boolean(poster);

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
    if (eager) return;
    if (!shouldLoadDecorativeVideo()) return;
    return scheduleIdle(() => setIdleReady(true));
  }, [eager, src]);

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
      const size = stillCanvasSize(
        video.videoWidth,
        video.videoHeight,
        window.devicePixelRatio || 1,
      );
      if (!canvas || !size) return;
      if (canvas.width !== size.width || canvas.height !== size.height) {
        canvas.width = size.width;
        canvas.height = size.height;
      }
      const context = canvas.getContext("2d");
      if (!context) return;
      try {
        context.drawImage(video, 0, 0, size.width, size.height);
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

    const onReady = () => {
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
    video.addEventListener("canplay", onReady);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", captureFrame);
    video.addEventListener("seeked", captureFrame);
    video.addEventListener("error", onError);
    document.addEventListener("visibilitychange", tryPlay);

    return () => {
      window.cancelAnimationFrame(playAfterLayout);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", captureFrame);
      video.removeEventListener("seeked", captureFrame);
      video.removeEventListener("error", onError);
      document.removeEventListener("visibilitychange", tryPlay);
    };
  }, [activeSrc, hasPoster, muted]);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const apply = () => fitVideoToDisplaySize(video, container, fit);
    apply();
    const frame = window.requestAnimationFrame(apply);
    const observer = new ResizeObserver(apply);
    observer.observe(container);
    video.addEventListener("loadedmetadata", apply);
    video.addEventListener("loadeddata", apply);
    window.addEventListener("resize", apply);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      video.removeEventListener("loadedmetadata", apply);
      video.removeEventListener("loadeddata", apply);
      window.removeEventListener("resize", apply);
    };
  }, [activeSrc, fit]);

  useEffect(() => {
    if (!onIntrinsicSize) return;

    let cancelled = false;
    const report = (width: number, height: number) => {
      if (cancelled || width < 2 || height < 2) return;
      onIntrinsicSize({ width, height });
    };

    let videoReported = false;
    const reportFrom = (width: number, height: number, source: "poster" | "video") => {
      if (source === "poster" && videoReported) return;
      if (source === "video") videoReported = true;
      report(width, height);
    };

    if (poster) {
      const image = new Image();
      const reportPoster = () =>
        reportFrom(image.naturalWidth, image.naturalHeight, "poster");
      image.onload = reportPoster;
      image.src = poster;
      if (image.complete) reportPoster();
    }

    const video = videoRef.current;
    const reportVideo = () => {
      if (!video) return;
      reportFrom(video.videoWidth, video.videoHeight, "video");
    };
    video?.addEventListener("loadedmetadata", reportVideo);
    video?.addEventListener("loadeddata", reportVideo);
    reportVideo();

    return () => {
      cancelled = true;
      video?.removeEventListener("loadedmetadata", reportVideo);
      video?.removeEventListener("loadeddata", reportVideo);
    };
  }, [activeSrc, onIntrinsicSize, poster]);

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
          "autoplay-loop-video pointer-events-none absolute inset-0 z-[1] h-full w-full object-center",
          fit === "contain" ? "object-contain" : "object-cover",
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
          className={`pointer-events-none absolute inset-0 z-[2] h-full w-full object-center ${
            fit === "contain" ? "object-contain" : "object-cover"
          } ${showCover ? "opacity-100" : "opacity-0"}`}
        />
      ) : null}
      {!hasPoster ? (
        <canvas
          ref={canvasRef}
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-[2] h-full w-full object-center ${
            fit === "contain" ? "object-contain" : "object-cover"
          } ${showCover && hasFrame ? "opacity-100" : "opacity-0"}`}
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
