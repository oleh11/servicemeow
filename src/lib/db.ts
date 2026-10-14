import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function ensureDatabaseUrl() {
  if (process.env.DATABASE_URL) return;

  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    try {
      const match = fs.readFileSync(envPath, "utf8").match(/^DATABASE_URL=["']?([^"'\r\n]+)/m);
      if (match) {
        process.env.DATABASE_URL = match[1];
        return;
      }
    } catch {}
  }

  // Fallback to local SQLite dev.db in prisma directory
  const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
  process.env.DATABASE_URL = `file:${dbPath}`;
}

function createClient() {
  ensureDatabaseUrl();
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
