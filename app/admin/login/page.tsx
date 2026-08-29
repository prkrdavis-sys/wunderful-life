import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  canAccessAdmin,
  isAdminAuthRequired,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const { error } = await searchParams;
  const session = (await cookies()).get(ADMIN_COOKIE)?.value;

  if (!isAdminAuthRequired() || canAccessAdmin(session)) {
    redirect("/?admin=1");
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16 sm:px-6">
      <form
        method="post"
        action="/api/admin/login"
        className="w-full max-w-sm rounded-2xl border border-brown/15 bg-paper p-5 shadow-2xl"
      >
        <h1 className="font-display text-xl text-brown">Admin</h1>
        <p className="mt-1 text-sm text-ink/70">
          Enter the password to edit this site.
        </p>
        <input
          id="admin-password"
          name="password"
          type="password"
          placeholder="Password"
          className="mt-4 w-full min-w-0 rounded-xl border border-lavender/40 bg-cream py-2 px-3 text-base text-ink outline-none focus:border-forest/50"
          required
          autoComplete="current-password"
        />
        {error ? (
          <p className="mt-3 rounded-lg bg-blush/15 px-3 py-2 text-xs text-forest">
            Invalid password.
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-end">
          <button
            type="submit"
            className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-paper transition hover:bg-forest-deep"
          >
            Unlock
          </button>
        </div>
      </form>
    </section>
  );
}
