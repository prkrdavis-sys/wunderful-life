import Image from "next/image";

type VideoThumbnailProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
};

export function VideoThumbnail({
  src,
  alt,
  className = "object-cover",
  sizes,
}: VideoThumbnailProps) {
  if (!src) {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green/30 via-pink/20 to-yellow/30 ${className}`}
      >
        <span className="font-display text-2xl text-brown/30" aria-hidden>
          ▶
        </span>
        <span className="sr-only">{alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      unoptimized={src.endsWith(".svg")}
    />
  );
}
