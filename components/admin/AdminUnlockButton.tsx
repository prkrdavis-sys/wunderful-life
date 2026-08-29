"use client";

import type { MouseEvent } from "react";
import { useAdminView } from "@/components/admin/AdminViewProvider";

const LOGIN_HREF = "/admin/login";

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

export function AdminUnlockButton() {
  const { viewMode } = useAdminView();
  if (viewMode === "admin") return null;

  return (
    <a
      href={LOGIN_HREF}
      className="relative z-10 inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-[11px] tracking-wide text-ink/35 transition hover:text-ink/55"
      onClick={(event) => {
        if (isModifiedClick(event)) return;
        event.preventDefault();
        window.location.assign(LOGIN_HREF);
      }}
    >
      Admin
    </a>
  );
}
