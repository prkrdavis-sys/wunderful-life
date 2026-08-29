"use client";

import Link from "next/link";
import { useAdminView } from "@/components/admin/AdminViewProvider";

export function AdminUnlockButton() {
  const { viewMode } = useAdminView();
  if (viewMode === "admin") return null;

  return (
    <Link
      href="/admin/login"
      className="relative z-10 text-[11px] tracking-wide text-ink/35 transition hover:text-ink/55"
    >
      Admin
    </Link>
  );
}
