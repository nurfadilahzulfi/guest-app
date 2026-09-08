import { PrismaClient } from "@prisma/client";

/**
 * Singleton PrismaClient — mencegah multiple instances saat hot reload di development.
 * @type {PrismaClient}
 */

const globalForPrisma = globalThis;

/** @type {PrismaClient} */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
