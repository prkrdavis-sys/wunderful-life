"use client";

import { useRouter } from "next/navigation";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

export function AdminLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <AnimatedButton type="button" variant="ghost" onClick={() => void handleLogout()}>
      Sign out
    </AnimatedButton>
  );
}
