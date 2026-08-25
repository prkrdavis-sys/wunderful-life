"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type DeferredMountProps = {
  children: ReactNode;
  rootMargin?: string;
  className?: string;
};

export function DeferredMount({
  children,
  rootMargin = "280px",
  className,
}: DeferredMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, visible]);

  return (
    <div ref={ref} className={className}>
      {visible ? children : null}
    </div>
  );
}
