import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="relative min-h-screen px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <p className="font-label text-sm font-semibold tracking-[0.2em] text-pink-deep uppercase">
          Creator Tools
        </p>
        <h1 className="mt-2 font-display text-4xl text-brown">Admin Login</h1>
        <p className="mt-3 text-muted">
          Enter the admin password to manage videos.
        </p>
        <Suspense>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
