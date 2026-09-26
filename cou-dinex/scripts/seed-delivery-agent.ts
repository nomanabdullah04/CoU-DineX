import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";
import { Role } from "@prisma/client";

async function main() {
  console.log("=== Seeding Delivery Agent for Phase 12 ===");

  const email = "delivery@cou.ac.bd";
  const phone = "+8801712345678";
  const plainPassword = "Delivery@123";
  const passwordHash = await hashPassword(plainPassword);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      fullName: "Tanvir Hasan (Rider)",
      role: Role.DELIVERY_AGENT,
      isEmailVerified: true,
      isActive: true,
      passwordHash,
    },
    create: {
      fullName: "Tanvir Hasan (Rider)",
      email,
      phone,
      passwordHash,
      role: Role.DELIVERY_AGENT,
      isEmailVerified: true,
      isActive: true,
    },
  });

  const agent = await prisma.deliveryAgent.upsert({
    where: { userId: user.id },
    update: {
      vehicleType: "Motorbike / Campus Bicycle",
      licenseNumber: "COU-DL-2026-042",
      isAvailable: true,
      currentLatitude: 23.4192,
      currentLongitude: 91.1376,
    },
    create: {
      userId: user.id,
      vehicleType: "Motorbike / Campus Bicycle",
      licenseNumber: "COU-DL-2026-042",
      isAvailable: true,
      currentLatitude: 23.4192,
      currentLongitude: 91.1376,
    },
  });

  console.log(`✅ Delivery Agent created/updated successfully:`);
  console.log(`   User ID: ${user.id}`);
  console.log(`   Agent ID: ${agent.id}`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${plainPassword}`);
  console.log(`   Vehicle: ${agent.vehicleType}`);
}

main()
  .catch((e) => {
    console.error("Error seeding delivery agent:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
