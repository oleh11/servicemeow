import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { randomBytes } from "node:crypto";

// Seed passwords come from the environment; if unset, a random one is generated and
// printed once. There are no shared, hardcoded default passwords.
function seedPassword(envVar: string, label: string): string {
  const fromEnv = process.env[envVar];
  if (fromEnv && fromEnv.length >= 8) return fromEnv;
  const generated = randomBytes(12).toString("base64url");
  console.log(`  [seed] ${label} password (set ${envVar} to choose your own): ${generated}`);
  return generated;
}

async function seedPasswords() {
  console.log("Seeding bcrypt password hashes for all users...");
  const defaultHash = await hashPassword(seedPassword("SEED_DEFAULT_PASSWORD", "Default (all non-admin users)"));
  const adminHash = await hashPassword(seedPassword("SEED_ADMIN_PASSWORD", "Admin"));

  const users = await db.user.findMany();
  console.log(`Found ${users.length} users to update.`);

  for (const user of users) {
    const hashToUse = user.role === "admin" ? adminHash : defaultHash;
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashToUse,
        userName: user.userName || user.email.split("@")[0],
      },
    });
    console.log(`Updated user: ${user.name} (${user.email}) [role: ${user.role}]`);
  }

  console.log("Bcrypt password hashing complete!");
}

seedPasswords()
  .catch((err) => {
    console.error("Failed to seed passwords:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
