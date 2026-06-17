import Image from "next/image";
import {
  plantWallpapers,
  type PlantWallpaperAsset,
  type PlantWallpaperId,
  type WallpaperOverlay,
} from "@/lib/plants";

const overlayClasses: Record<WallpaperOverlay, string> = {
  minimal: "plant-wallpaper-overlay-minimal",
  light: "plant-wallpaper-overlay-light",
  medium: "plant-wallpaper-overlay-medium",
  heavy: "plant-wallpaper-overlay-heavy",
};

type PlantSectionBackgroundProps = {
  wallpaper: PlantWallpaperId;
  overlay?: WallpaperOverlay;
  priority?: boolean;
};

export function PlantSectionBackground({
  wallpaper,
  overlay = "minimal",
  priority = false,
}: PlantSectionBackgroundProps) {
  const asset: PlantWallpaperAsset = plantWallpapers[wallpaper];
  const imageFilter = [
    asset.saturation ? `saturate(${asset.saturation})` : null,
    asset.contrast ? `contrast(${asset.contrast})` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <Image
        src={asset.src}
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover"
        style={{
          objectPosition: asset.position,
          filter: imageFilter || undefined,
        }}
      />
      <div className={`absolute inset-0 ${overlayClasses[overlay]}`} />
    </div>
  );
}
