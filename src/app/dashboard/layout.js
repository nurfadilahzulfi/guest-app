import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth-options";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata = {
  title: "Dashboard — PT. Tanimas Resources Internasional",
  description: "Portal internal pengelolaan buku tamu digital PT. Tanimas Resources Internasional.",
};

/**
 * Layout server-side untuk memproteksi seluruh rute di bawah /dashboard.
 * Memastikan hanya user dengan sesi aktif yang dapat mengakses (AGENTS.md Bagian 7).
 */
export default async function DashboardLayout({ children }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardShell user={session.user}>
      {children}
    </DashboardShell>
  );
}
