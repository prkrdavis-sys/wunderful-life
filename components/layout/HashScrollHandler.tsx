"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { scrollToSectionWhenReady } from "@/lib/scrollToSection";

/**
 * Scrolls to hash targets on the home page — initial load, cross-route nav, and hash changes.
 */
export function HashScrollHandler() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;

    let cancelScroll = () => {};

    const scrollToHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;

      cancelScroll();
      cancelScroll = scrollToSectionWhenReady(hash);
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);

    return () => {
      window.removeEventListener("hashchange", scrollToHash);
      cancelScroll();
    };
  }, [pathname]);

  return null;
}
