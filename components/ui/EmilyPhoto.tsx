import Image from "next/image";
import { isRemoteMediaUrl } from "@/lib/media/urls";
import {
  resolveAboutPhotoFrame,
  type AboutPhoto,
  type AboutPhotoFrame,
} from "@/lib/site/types";

const PHOTO_FRAME_GRADIENT = "from-lavender/55 via-lavender/22 to-cream";

type EmilyPhotoSize = "sm" | "md" | "lg" | "xl" | "hero" | "gallery";

type EmilyPhotoProps = {
  photo: AboutPhoto;
  size?: EmilyPhotoSize;
  className?: string;
};

const sizeClasses: Record<EmilyPhotoSize, string> = {
  sm: "w-[160px] max-w-full",
  md: "w-[260px] max-w-full sm:w-[290px]",
  lg: "w-[280px] max-w-full sm:w-[340px] xl:w-[400px]",
  xl: "w-[320px] max-w-full sm:w-[420px] xl:w-[480px]",
  hero: "w-full max-w-full sm:max-w-[min(100%,480px)] xl:max-w-[min(100%,560px)]",
  gallery: "w-full max-w-md mx-auto sm:max-w-none",
};

const polaroidPadClasses: Record<EmilyPhotoSize, string> = {
  sm: "p-2",
  md: "p-2",
  lg: "p-2.5",
  xl: "p-3",
  hero: "p-3 sm:p-4",
  gallery: "p-2.5 sm:p-3",
};

const imageSizes: Record<EmilyPhotoSize, string> = {
  sm: "160px",
  md: "290px",
  lg: "340px",
  xl: "480px",
  hero: "(max-width: 640px) 360px, (max-width: 1024px) 480px, 640px",
  gallery: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
};

const shapedWindowClasses: Record<
  Exclude<AboutPhotoFrame, "polaroid">,
  string
> = {
  arch: "aspect-[3/4] rounded-t-full",
  oval: "aspect-[4/5] rounded-full",
  circle: "aspect-square rounded-full",
  rounded: "aspect-[4/5] rounded-3xl",
  square: "aspect-square rounded-2xl",
};

function PhotoCaption({ caption }: { caption: string }) {
  return (
    <figcaption className="font-label mt-3 w-full text-center text-xs tracking-wide break-words text-ink/90 sm:text-sm">
      {caption}
    </figcaption>
  );
}

function PhotoMedia({
  photo,
  size,
}: {
  photo: AboutPhoto;
  size: EmilyPhotoSize;
}) {
  if (photo.imagePath) {
    return (
      <Image
        src={photo.imagePath}
        alt={photo.caption}
        fill
        sizes={imageSizes[size]}
        decoding="async"
        unoptimized={isRemoteMediaUrl(photo.imagePath)}
        className="object-cover object-center"
      />
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
      <span className="font-display text-4xl text-brown/25 sm:text-5xl">E</span>
      <p className="text-[10px] leading-snug text-brown/50 sm:text-xs">
        Photo placeholder
      </p>
    </div>
  );
}

function PolaroidPhoto({
  photo,
  size,
  className,
}: {
  photo: AboutPhoto;
  size: EmilyPhotoSize;
  className: string;
}) {
  return (
    <figure
      className={`max-w-full ${sizeClasses[size]} ${polaroidPadClasses[size]} rotate-[var(--photo-rotate)] rounded-sm border border-white/90 bg-paper shadow-lg shadow-ink/10 ring-1 ring-lavender/20 ${className}`}
      style={{ ["--photo-rotate" as string]: `${photo.rotate}deg` }}
    >
      <div
        className={`relative aspect-[4/5] overflow-hidden rounded-sm bg-gradient-to-br ${PHOTO_FRAME_GRADIENT}`}
      >
        <PhotoMedia photo={photo} size={size} />
      </div>
      <PhotoCaption caption={photo.caption} />
    </figure>
  );
}

function ShapedPhoto({
  photo,
  size,
  frame,
  className,
}: {
  photo: AboutPhoto;
  size: EmilyPhotoSize;
  frame: Exclude<AboutPhotoFrame, "polaroid">;
  className: string;
}) {
  return (
    <figure className={`max-w-full ${sizeClasses[size]} ${className}`}>
      <div
        className={`relative overflow-hidden bg-gradient-to-br shadow-lg shadow-ink/10 ${PHOTO_FRAME_GRADIENT} ${shapedWindowClasses[frame]}`}
      >
        <PhotoMedia photo={photo} size={size} />
      </div>
      <PhotoCaption caption={photo.caption} />
    </figure>
  );
}

export function EmilyPhoto({
  photo,
  size = "md",
  className = "",
}: EmilyPhotoProps) {
  const frame = resolveAboutPhotoFrame(photo.frame);

  switch (frame) {
    case "polaroid":
      return <PolaroidPhoto photo={photo} size={size} className={className} />;
    case "arch":
    case "oval":
    case "circle":
    case "rounded":
    case "square":
      return (
        <ShapedPhoto
          photo={photo}
          size={size}
          frame={frame}
          className={className}
        />
      );
    default: {
      const _exhaustive: never = frame;
      return _exhaustive;
    }
  }
}
