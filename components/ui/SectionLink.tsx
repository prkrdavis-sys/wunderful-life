"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent, ReactNode } from "react";

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

    if (pathname === "/") {
      event.preventDefault();
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", `#${sectionId}`);
      }
      return;
    }

    event.preventDefault();
    router.push(`/#${sectionId}`);
  };

  return (
    <Link href={href} className={className} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
