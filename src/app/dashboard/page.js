import { auth } from "@/infrastructure/auth/auth-options";
import { DashboardHomeView } from "@/components/dashboard/dashboard-home-view";

export const metadata = {
  title: "Dashboard Kunjungan — PT. TANIMAS RESOURCES INTERNATIONAL",
};

export default async function DashboardPage() {
  const session = await auth();

  return <DashboardHomeView user={session?.user} />;
}
