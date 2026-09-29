import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

function errorMessage(error: string | undefined): string | null {
  if (!error) return null;
  if (error === "empty") return "Enter the password to continue.";
  return "Invalid password.";
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const { error } = await searchParams;

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16 sm:px-6">
      <AdminLoginForm initialError={errorMessage(error)} />
    </section>
  );
}
