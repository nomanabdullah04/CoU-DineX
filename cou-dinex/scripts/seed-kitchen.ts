import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Kitchen Staff User for CoU DineX KDS...");

  const passwordHash = await bcrypt.hash("Kitchen@123", 10);

  const kitchenUser = await prisma.user.upsert({
    where: { email: "kitchen@cou.ac.bd" },
    update: {
      fullName: "Central Kitchen Staff",
      role: Role.CAFETERIA_STAFF,
      passwordHash,
      isActive: true,
      isEmailVerified: true,
    },
    create: {
      email: "kitchen@cou.ac.bd",
      phone: "01788888888",
      fullName: "Central Kitchen Staff",
      role: Role.CAFETERIA_STAFF,
      passwordHash,
      isActive: true,
      isEmailVerified: true,
    },
  });

  console.log(`✅ Kitchen staff ready: ${kitchenUser.email} (Role: ${kitchenUser.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
