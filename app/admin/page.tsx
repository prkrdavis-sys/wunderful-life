import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { isAdminAuthRequired } from "@/lib/auth";
import { listVideos } from "@/lib/storage";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const videos = await listVideos();

  return (
    <div className="relative min-h-screen px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-pink-deep uppercase">
              Creator Tools
            </p>
            <h1 className="mt-2 font-display text-4xl text-brown">Admin</h1>
            <p className="mt-3 text-muted">
              Upload videos, manage metadata, and reorder your portfolio.
              {isAdminAuthRequired()
                ? " Protected by ADMIN_PASSWORD."
                : " Set ADMIN_PASSWORD to require login."}
            </p>
          </div>
          {isAdminAuthRequired() && <AdminLogoutButton />}
        </div>
        <div className="mt-10">
          <AdminDashboard initialVideos={videos} />
        </div>
      </div>
    </div>
  );
}
