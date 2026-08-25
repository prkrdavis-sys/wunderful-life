import Image from "next/image";

export const BRAND_LOGO = {
  src: "/brand/logo.png",
  width: 1254,
  height: 1254,
} as const;

type BrandLogoProps = {
  alt: string;
  sizes: string;
  className?: string;
  preload?: boolean;
};

export function BrandLogo({ alt, sizes, className, preload }: BrandLogoProps) {
  return (
    <Image
      src={BRAND_LOGO.src}
      alt={alt}
      width={BRAND_LOGO.width}
      height={BRAND_LOGO.height}
      sizes={sizes}
      preload={preload}
      className={`bg-transparent ${className ?? ""}`.trim()}
    />
  );
}
