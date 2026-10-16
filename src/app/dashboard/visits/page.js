import { auth } from "@/infrastructure/auth/auth-options";
import { VisitsHistoryView } from "@/components/dashboard/visits/visits-history-view";

export const metadata = {
  title: "Riwayat Kunjungan — PT. TANIMAS RESOURCES INTERNATIONAL",
  description: "Buku tamu dan riwayat kunjungan lengkap PT. TANIMAS RESOURCES INTERNATIONAL.",
};

/**
 * Halaman khusus Riwayat Kunjungan dan Buku Tamu.
 * Dapat diakses oleh seluruh peran pengguna terotentikasi (HOST, ADMIN_HRD, ADMINISTRATOR).
 */
export default async function VisitsPage() {
  const session = await auth();

  return <VisitsHistoryView user={session?.user} />;
}
