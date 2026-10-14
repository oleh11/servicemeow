const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

let dbUrl = process.env.DATABASE_URL || "";
if (!dbUrl && fs.existsSync(path.join(__dirname, "..", ".env"))) {
  const envContent = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
  const match = envContent.match(/^DATABASE_URL=["']?([^"'\r\n]+)/m);
  if (match) dbUrl = match[1];
}

const isPostgres = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");
const schemaFile = isPostgres
  ? "prisma/schema.prisma"
  : "prisma/schema.sqlite.prisma";

console.log(`[generate] Generating Prisma Client using ${schemaFile}...`);
try {
  execSync(`npx prisma generate --schema=${schemaFile}`, { stdio: "inherit" });
} catch (err) {
  const clientExists = fs.existsSync(path.join(__dirname, "..", "node_modules", "@prisma", "client", "index.js"));
  if (clientExists) {
    console.warn("[generate] Warning: Prisma generate encountered a lock (active dev server on Windows), using existing generated client.");
  } else {
    throw err;
  }
}
