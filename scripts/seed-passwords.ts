import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function seedPasswords() {
  console.log("Seeding bcrypt password hashes for all users...");
  const defaultHash = await hashPassword("ServiceMeow!2026");
  const adminHash = await hashPassword("admin123");

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
