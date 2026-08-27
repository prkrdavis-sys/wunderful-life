import Image from "next/image";

export const BRAND_LOGO = {
  src: "/brand/logo.png",
  width: 512,
  height: 512,
} as const;

export const SIGNATURE = {
  src: "/brand/emily-wunden-signature.png",
  width: 992,
  height: 292,
} as const;

type BrandLogoProps = {
  alt: string;
  sizes: string;
  className?: string;
  preload?: boolean;
  loading?: "lazy" | "eager";
};

export function BrandLogo({
  alt,
  sizes,
  className,
  preload,
  loading,
}: BrandLogoProps) {
  return (
    <Image
      src={BRAND_LOGO.src}
      alt={alt}
      width={BRAND_LOGO.width}
      height={BRAND_LOGO.height}
      sizes={sizes}
      preload={preload}
      loading={preload ? undefined : loading}
      className={`bg-transparent ${className ?? ""}`.trim()}
    />
  );
}
