"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";
import type { PortfolioVideo } from "@/lib/videos/types";
import { VideoThumbnail } from "@/components/ui/VideoThumbnail";
import { PhoneFrame } from "./PhoneFrame";

type PhoneVideoPlayerProps = {
  video: PortfolioVideo;
  accentIndex?: number;
  tilt?: number;
  size?: "sm" | "md" | "lg";
  activeId: string | null;
  onActivate: (id: string | null) => void;
  showTitle?: boolean;
  linkToDetail?: boolean;
};

export function PhoneVideoPlayer({
  video,
  accentIndex = 0,
  tilt = 0,
  size = "md",
  activeId,
  onActivate,
  showTitle = true,
  linkToDetail = true,
}: PhoneVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isPlaying = activeId === video.id;

  const handleClick = useCallback(() => {
    if (isPlaying) {
      videoRef.current?.pause();
      onActivate(null);
      return;
    }
    onActivate(video.id);
  }, [isPlaying, onActivate, video.id]);

  useEffect(() => {
    if (isPlaying && videoRef.current) {
      void videoRef.current.play();
    }
    if (!isPlaying && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isPlaying]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <PhoneFrame
        tilt={tilt}
        accentIndex={accentIndex}
        size={size}
        isActive={isPlaying}
      >
        <button
          type="button"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className="group relative h-full w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-brown"
          aria-label={isPlaying ? `Pause ${video.title}` : `Play ${video.title}`}
          aria-pressed={isPlaying}
        >
          <AnimatePresence mode="wait">
            {!isPlaying ? (
              <motion.div
                key="thumb"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <VideoThumbnail
                  src={video.thumbnailPath}
                  alt={video.title}
                  sizes="(max-width: 768px) 160px, 260px"
                />
                <div className="absolute inset-0 bg-brown/10 transition group-hover:bg-brown/5" />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-brown shadow-lg">
                    ▶
                  </span>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="video"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black"
              >
                <video
                  ref={videoRef}
                  src={video.videoPath}
                  controls
                  playsInline
                  className="h-full w-full object-cover"
                  onEnded={() => onActivate(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </PhoneFrame>

      {showTitle && (
        <div className="max-w-[200px] text-center">
          <p className="text-sm font-semibold text-brown">{video.title}</p>
          <p className="text-xs text-muted">{video.brand}</p>
          {linkToDetail && (
            <Link
              href={`/work/${video.slug}`}
              className="mt-1 inline-block text-xs font-medium text-pink-deep hover:underline"
            >
              View details
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
