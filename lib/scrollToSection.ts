export const SITE_HEADER_ID = "site-header";

const SITE_HEADER_HEIGHT_VAR = "--site-header-height";
const HEADER_RESIZE_SETTLE_MS = 450;
const SECTION_SCROLL_MAX_ATTEMPTS = 40;
/** Matches the nav lockup when JS has not measured the header yet. */
const DEFAULT_SITE_HEADER_HEIGHT_PX = 84;
/** Space between the sticky nav and the section title after a tab jump. */
const SECTION_SCROLL_GAP_PX = 20;

export function syncSiteHeaderHeight(): number {
  if (typeof document === "undefined") return 0;

  const header = document.getElementById(SITE_HEADER_ID);
  const measured = header?.getBoundingClientRect().height ?? 0;
  const height = measured > 0 ? measured : DEFAULT_SITE_HEADER_HEIGHT_PX;
  document.documentElement.style.setProperty(SITE_HEADER_HEIGHT_VAR, `${height}px`);
  return height;
}

export function getSiteHeaderHeight(): number {
  const header = document.getElementById(SITE_HEADER_ID);
  const measured = header?.getBoundingClientRect().height ?? 0;
  return measured > 0 ? measured : DEFAULT_SITE_HEADER_HEIGHT_PX;
}

export function getSectionScrollOffset(): number {
  return getSiteHeaderHeight() + SECTION_SCROLL_GAP_PX;
}

function resolveScrollTarget(sectionId: string): HTMLElement | null {
  const root = document.getElementById(sectionId);
  if (!root) return null;
  if (root.matches("h1, h2, h3, h4, h5, h6")) return root;

  const heading = root.querySelector<HTMLElement>("h1, h2, h3, h4, h5, h6");
  return heading ?? root;
}

/**
 * Document Y of the element's layout box. Reveal animations use translateY,
 * which would otherwise make getBoundingClientRect aim too low, then the
 * title slides up under the nav once the animation finishes.
 */
function getLayoutDocumentTop(element: HTMLElement): number {
  let translateY = 0;
  let node: HTMLElement | null = element;

  while (node && node !== document.documentElement) {
    const transform = getComputedStyle(node).transform;
    if (transform && transform !== "none") {
      translateY += new DOMMatrixReadOnly(transform).m42;
    }
    node = node.parentElement;
  }

  return element.getBoundingClientRect().top + window.scrollY - translateY;
}

function getSectionScrollTop(target: HTMLElement): number {
  return getLayoutDocumentTop(target) - getSectionScrollOffset();
}

function performSectionScroll(
  target: HTMLElement,
  behavior: ScrollBehavior,
): void {
  syncSiteHeaderHeight();
  const top = Math.max(0, getSectionScrollTop(target));
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;

  // html { scroll-behavior: smooth } can override behavior:"auto" and race
  // the browser's own hash scroll, landing the title under the sticky nav.
  if (behavior === "auto") {
    root.style.scrollBehavior = "auto";
  }

  window.scrollTo({ top, behavior });

  if (behavior === "auto") {
    root.style.scrollBehavior = previousBehavior;
  }
}

function watchHeaderResizeAndCorrect(target: HTMLElement): () => void {
  const header = document.getElementById(SITE_HEADER_ID);
  let cancelled = false;
  let resizeCorrected = false;
  let observer: ResizeObserver | null = null;

  if (header && typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(() => {
      if (cancelled || resizeCorrected) return;
      resizeCorrected = true;
      performSectionScroll(target, "auto");
      observer?.disconnect();
    });
    observer.observe(header);
  }

  const timeout = window.setTimeout(() => {
    if (cancelled) return;
    performSectionScroll(target, "auto");
    observer?.disconnect();
  }, HEADER_RESIZE_SETTLE_MS);

  return () => {
    cancelled = true;
    window.clearTimeout(timeout);
    observer?.disconnect();
  };
}

export function scrollToSection(
  sectionId: string,
  behavior: ScrollBehavior = "smooth",
): boolean {
  const target = resolveScrollTarget(sectionId);
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

    const target = resolveScrollTarget(sectionId);
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
