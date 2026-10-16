import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth-options";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata = {
  title: "Dashboard — PT. TANIMAS RESOURCES INTERNATIONAL",
  description: "Portal internal pengelolaan buku tamu digital PT. TANIMAS RESOURCES INTERNATIONAL.",
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
