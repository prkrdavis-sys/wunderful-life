import type { ReactNode } from "react";

type DeferredMountProps = {
  children: ReactNode;
  className?: string;
};

/** Layout wrapper. Children always render — videos still lazy-decode themselves. */
export function DeferredMount({ children, className }: DeferredMountProps) {
  return <div className={className}>{children}</div>;
}
