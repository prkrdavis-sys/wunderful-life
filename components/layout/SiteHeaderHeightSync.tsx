"use client";

import { useEffect } from "react";
import { SITE_HEADER_ID, syncSiteHeaderHeight } from "@/lib/scrollToSection";

export function SiteHeaderHeightSync() {
  useEffect(() => {
    syncSiteHeaderHeight();

    const header = document.getElementById(SITE_HEADER_ID);
    if (!header) return;

    const observer = new ResizeObserver(() => syncSiteHeaderHeight());
    observer.observe(header);
    window.addEventListener("resize", syncSiteHeaderHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncSiteHeaderHeight);
    };
  }, []);

  return null;
}
