import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();


async function main() {
  console.log("🌱 Menyiapkan akun Administrator PT TANIMAS RESOURCES INTERNASIONAL...");

  // Administrator Utama
  const adminPasswordHash = await bcrypt.hash("admin123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@tanimas.co.id" },
    update: {
      name: "Administrator Sistem",
      role: "ADMINISTRATOR",
      department: "Management",
      position: "System Administrator",
      isActive: true,
    },
    create: {
      name: "Administrator Sistem",
      email: "admin@tanimas.co.id",
      passwordHash: adminPasswordHash,
      role: "ADMINISTRATOR",
      department: "Management",
      position: "System Administrator",
      isActive: true,
    },
  });

  console.log(`✅ Administrator siap: ${admin.email} (password: admin123456)`);
  console.log("ℹ️  Seluruh data staf, host, dan owner dikelola secara dinamis oleh Administrator.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
