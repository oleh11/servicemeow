const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

let dbUrl = process.env.DATABASE_URL || "";
if (!dbUrl && fs.existsSync(path.join(__dirname, "..", ".env"))) {
  const envContent = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
  const match = envContent.match(/^DATABASE_URL=["']?([^"'\r\n]+)/m);
  if (match) dbUrl = match[1];
}

const schemaFile = dbUrl.startsWith("file:") || dbUrl.includes(".db")
  ? "prisma/schema.sqlite.prisma"
  : "prisma/schema.prisma";

console.log(`[generate] Generating Prisma Client using ${schemaFile}...`);
execSync(`npx prisma generate --schema=${schemaFile}`, { stdio: "inherit" });
