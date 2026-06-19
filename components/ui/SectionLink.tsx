"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { scrollToSectionWhenReady } from "@/lib/scrollToSection";

type SectionLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
} & Omit<ComponentProps<"a">, "href" | "children" | "onClick">;

function getSectionId(href: string): string | null {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return null;
  return href.slice(hashIndex + 1) || null;
}

export function SectionLink({
  href,
  children,
  className = "",
  onClick,
  ...rest
}: SectionLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const sectionId = getSectionId(href);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.();

    if (!sectionId) return;

    event.preventDefault();

    if (pathname === "/") {
      scrollToSectionWhenReady(sectionId);
      window.history.replaceState(null, "", `#${sectionId}`);
      return;
    }

    router.push(`/#${sectionId}`, { scroll: false });
  };

  return (
    <Link href={href} className={className} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
