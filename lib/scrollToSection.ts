export const SITE_HEADER_ID = "site-header";

const SITE_HEADER_HEIGHT_VAR = "--site-header-height";
const HEADER_RESIZE_SETTLE_MS = 450;
const SECTION_SCROLL_MAX_ATTEMPTS = 40;

export function syncSiteHeaderHeight(): number {
  if (typeof document === "undefined") return 0;

  const header = document.getElementById(SITE_HEADER_ID);
  const height = header?.getBoundingClientRect().height ?? 0;
  document.documentElement.style.setProperty(SITE_HEADER_HEIGHT_VAR, `${height}px`);
  return height;
}

export function getSiteHeaderHeight(): number {
  const header = document.getElementById(SITE_HEADER_ID);
  return header?.getBoundingClientRect().height ?? 0;
}

function getSectionScrollTop(target: HTMLElement): number {
  return target.getBoundingClientRect().top + window.scrollY - getSiteHeaderHeight();
}

function performSectionScroll(
  target: HTMLElement,
  behavior: ScrollBehavior,
): void {
  syncSiteHeaderHeight();
  window.scrollTo({ top: getSectionScrollTop(target), behavior });
}

function watchHeaderResizeAndCorrect(target: HTMLElement): () => void {
  const header = document.getElementById(SITE_HEADER_ID);
  if (!header || typeof ResizeObserver === "undefined") {
    return () => {};
  }

  let corrected = false;
  const observer = new ResizeObserver(() => {
    if (corrected) return;
    corrected = true;
    performSectionScroll(target, "auto");
    observer.disconnect();
  });

  observer.observe(header);

  const timeout = window.setTimeout(() => {
    corrected = true;
    observer.disconnect();
  }, HEADER_RESIZE_SETTLE_MS);

  return () => {
    corrected = true;
    window.clearTimeout(timeout);
    observer.disconnect();
  };
}

export function scrollToSection(
  sectionId: string,
  behavior: ScrollBehavior = "smooth",
): boolean {
  const target = document.getElementById(sectionId);
  if (!target) return false;

  performSectionScroll(target, behavior);
  watchHeaderResizeAndCorrect(target);
  return true;
}

export function scrollToSectionWhenReady(
  sectionId: string,
  behavior: ScrollBehavior = "smooth",
): () => void {
  let cancelled = false;
  let cleanupResize = () => {};
  let attempts = 0;

  const tryScroll = () => {
    if (cancelled) return;
    attempts += 1;

    const target = document.getElementById(sectionId);
    if (target) {
      performSectionScroll(target, behavior);
      cleanupResize = watchHeaderResizeAndCorrect(target);
      return;
    }

    if (attempts < SECTION_SCROLL_MAX_ATTEMPTS) {
      requestAnimationFrame(tryScroll);
    }
  };

  syncSiteHeaderHeight();
  requestAnimationFrame(() => {
    requestAnimationFrame(tryScroll);
  });

  return () => {
    cancelled = true;
    cleanupResize();
  };
}
