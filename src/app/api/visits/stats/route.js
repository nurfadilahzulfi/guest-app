import { auth } from "@/infrastructure/auth/auth-options";
import { canViewAllVisits } from "@/domain/entities/user";
import { prisma } from "@/infrastructure/prisma/client";

/**
 * GET /api/visits/stats
 * Mengembalikan data agregat kunjungan untuk chart dan statistik dashboard.
 * Dapat diakses oleh HOST (data kunjungannya sendiri) dan ADMIN_HRD / ADMINISTRATOR (data seluruh perusahaan).
 *
 * @returns {Promise<Response>}
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const isHost = role === "HOST";
    const isAdminOrHRD = canViewAllVisits(session.user);

    if (!isHost && !isAdminOrHRD) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Filter dasar: Host hanya melihat kunjungan miliknya, Admin melihat semua
    const baseWhere = isHost ? { hostId: session.user.id } : {};

    const now = new Date();

    // Rentang 30 hari terakhir untuk trend harian
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Ambil semua kunjungan 30 hari terakhir
    const recentVisits = await prisma.visit.findMany({
      where: {
        ...baseWhere,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        status: true,
        visitorType: true,
        guestName: true,
        organization: true,
        hostId: true,
        host: {
          select: { name: true, department: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Bangun trend harian (30 hari terakhir) mencakup hari ini
    const dailyMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;
      dailyMap[key] = { date: key, total: 0, approved: 0, rejected: 0, pending: 0 };
    }

    for (const v of recentVisits) {
      const d = new Date(v.createdAt);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;
      if (dailyMap[key]) {
        dailyMap[key].total++;
        if (v.status === "APPROVED") dailyMap[key].approved++;
        else if (v.status === "REJECTED") dailyMap[key].rejected++;
        else dailyMap[key].pending++;
      }
    }

    const dailyTrend = Object.values(dailyMap);

    // Distribusi status keseluruhan (semua waktu sesuai filter)
    const [pendingCount, approvedCount, rejectedCount, totalCount] = await Promise.all([
      prisma.visit.count({ where: { ...baseWhere, status: "PENDING" } }),
      prisma.visit.count({ where: { ...baseWhere, status: "APPROVED" } }),
      prisma.visit.count({ where: { ...baseWhere, status: "REJECTED" } }),
      prisma.visit.count({ where: baseWhere }),
    ]);

    // Distribusi tipe tamu (semua waktu sesuai filter)
    const [regularCount, ownerCount] = await Promise.all([
      prisma.visit.count({ where: { ...baseWhere, visitorType: "REGULAR" } }),
      prisma.visit.count({ where: { ...baseWhere, visitorType: "OWNER" } }),
    ]);

    // Top item (30 hari):
    // - Jika Admin/HRD: Top 5 Host terbanyak dikunjungi
    // - Jika Host: Top 5 Instansi / Tamu yang berkunjung ke dirinya
    let topItems = [];
    if (!isHost) {
      const hostCountMap = {};
      for (const v of recentVisits) {
        const key = v.hostId;
        if (!hostCountMap[key]) {
          hostCountMap[key] = {
            name: v.host?.name || "—",
            department: v.host?.department || "—",
            count: 0,
          };
        }
        hostCountMap[key].count++;
      }
      topItems = Object.values(hostCountMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    } else {
      const guestOrgMap = {};
      for (const v of recentVisits) {
        const key = v.organization || v.guestName || "Lainnya";
        if (!guestOrgMap[key]) {
          guestOrgMap[key] = {
            name: key,
            department: v.organization ? v.guestName : "Tamu Pribadi",
            count: 0,
          };
        }
        guestOrgMap[key].count++;
      }
      topItems = Object.values(guestOrgMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }

    // Total bulan ini vs bulan lalu
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const [totalThisMonth, totalLastMonth] = await Promise.all([
      prisma.visit.count({
        where: {
          ...baseWhere,
          createdAt: { gte: startOfThisMonth },
        },
      }),
      prisma.visit.count({
        where: {
          ...baseWhere,
          createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
        },
      }),
    ]);

    return Response.json({
      isHost,
      dailyTrend,
      statusDistribution: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
      visitorTypeDistribution: {
        regular: regularCount,
        owner: ownerCount,
      },
      topHosts: topItems,
      totalThisMonth,
      totalLastMonth,
      summary: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        owner: ownerCount,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
