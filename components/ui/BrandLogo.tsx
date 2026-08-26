import Image from "next/image";

export const BRAND_LOGO = {
  src: "/brand/logo.png",
  width: 1254,
  height: 1254,
} as const;

export const SIGNATURE = {
  src: "/brand/emily-wunden-signature.png",
  width: 992,
  height: 292,
  /** Center of the transparent gap between the first and last name. */
  splitAt: 425,
} as const;

function signatureSliceWidth(side: "first" | "last"): number {
  switch (side) {
    case "first":
      return SIGNATURE.splitAt;
    case "last":
      return SIGNATURE.width - SIGNATURE.splitAt;
    default: {
      const _exhaustive: never = side;
      return _exhaustive;
    }
  }
}

export function SignatureHalf({
  side,
  alt,
  sizes,
  className,
}: {
  side: "first" | "last";
  alt: string;
  sizes: string;
  className?: string;
}) {
  const sliceWidth = signatureSliceWidth(side);
  const objectPosition = side === "first" ? "left center" : "right center";

  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`.trim()}
      style={{ aspectRatio: `${sliceWidth} / ${SIGNATURE.height}` }}
    >
      <Image
        src={SIGNATURE.src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover mix-blend-multiply"
        style={{ objectPosition }}
      />
    </div>
  );
}

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
