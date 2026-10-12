import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth-options";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata = {
  title: "Dashboard — PT. Tanimas Resources Internasional",
  description: "Portal internal pengelolaan buku tamu digital PT. Tanimas Resources Internasional.",
};

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
