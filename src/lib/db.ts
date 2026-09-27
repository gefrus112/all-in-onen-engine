import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Only create Prisma client if DATABASE_URL is available
// (skipped in static export builds)
export const db = process.env.DATABASE_URL
  ? (globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] }))
  : null;

if (process.env.NODE_ENV !== 'production' && db) {
  globalForPrisma.prisma = db as PrismaClient;
}
