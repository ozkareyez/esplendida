import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { PoolConfig } from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL no está configurada. Revisa tu archivo .env");
  }

  const config: PoolConfig = { connectionString: url };

  // Supabase exige SSL para conexiones externas (rejectUnauthorized false
  // porque su cert es de RDS; en producción conviene validarlo).
  // Cubre host directo (db.<ref>.supabase.co) y pooler (aws-N-<region>.pooler.supabase.com).
  if (/supabase\.(co|com)/.test(url)) {
    config.ssl = { rejectUnauthorized: false };
  }

  return new PrismaClient({ adapter: new PrismaPg(config) });
}

const globalPrisma = globalForPrisma.prisma;

export const prisma = globalPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}