import { PrismaClient } from "@prisma/client";

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    // Never return password hashes from any query (including nested relations).
    // Code that genuinely needs it (login) must opt in with `omit: { passwordHash: false }`.
    omit: { user: { passwordHash: true } },
  });
}

type DbClient = ReturnType<typeof createClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: DbClient | undefined;
};

export const db: DbClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
