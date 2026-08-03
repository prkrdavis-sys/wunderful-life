"use client";

import Image from "next/image";
import { useState } from "react";

type VideoThumbnailProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  /** Used when the still image is missing or fails to load. */
  videoSrc?: string | null;
};

function Placeholder({ alt, className }: { alt: string; className: string }) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-lavender/35 via-blush/20 to-sage-light/25 ${className}`}
    >
      <span className="font-display text-2xl text-brown/30" aria-hidden>
        ▶
      </span>
      <span className="sr-only">{alt}</span>
    </div>
  );
}

function VideoFrameFallback({
  alt,
  className,
  videoSrc,
}: {
  alt: string;
  className: string;
  videoSrc: string;
}) {
  const [frameReady, setFrameReady] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <Placeholder alt={alt} className={className} />;
  }

  return (
    <>
      {!frameReady && <Placeholder alt={alt} className={className} />}
      <video
        src={`${videoSrc}#t=0.001`}
        muted
        playsInline
        preload="metadata"
        className={`absolute inset-0 h-full w-full ${className} ${
          frameReady ? "opacity-100" : "opacity-0"
        }`}
        aria-label={alt}
        onLoadedData={(event) => {
          if (event.currentTarget.videoWidth > 0) {
            setFrameReady(true);
          } else {
            setFailed(true);
          }
        }}
        onError={() => setFailed(true)}
      />
    </>
  );
}

export function VideoThumbnail({
  src,
  alt,
  className = "object-cover",
  sizes,
  videoSrc,
}: VideoThumbnailProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    if (videoSrc) {
      return (
        <VideoFrameFallback
          alt={alt}
          className={className}
          videoSrc={videoSrc}
        />
      );
    }
    return <Placeholder alt={alt} className={className} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      unoptimized={src.endsWith(".svg")}
      onError={() => setFailed(true)}
    />
  );
}
