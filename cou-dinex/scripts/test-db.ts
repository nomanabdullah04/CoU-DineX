import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testConnection() {
  console.log("🔍 Testing PostgreSQL Database Connection for CoU DineX...\n");

  try {
    const startTime = Date.now();

    // 1. Raw query test
    const rawResult = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() as now;`;
    const latency = Date.now() - startTime;

    console.log("✅ PostgreSQL Connection: SUCCESSFUL!");
    console.log(`⏱️ Connection Latency: ${latency}ms`);
    console.log(`🕒 Server Time: ${rawResult[0]?.now}`);
    console.log("---------------------------------------------");

    // 2. Query table counts
    const [
      departmentsCount,
      hallsCount,
      cafeteriasCount,
      tablesCount,
      categoriesCount,
      menuItemsCount,
      inventoryCount,
      usersCount,
    ] = await Promise.all([
      prisma.department.count(),
      prisma.hall.count(),
      prisma.cafeteria.count(),
      prisma.diningTable.count(),
      prisma.menuCategory.count(),
      prisma.menuItem.count(),
      prisma.inventory.count(),
      prisma.user.count(),
    ]);

    console.log("📊 Database Record Counts:");
    console.log(`   • Departments:      ${departmentsCount}`);
    console.log(`   • Residential Halls:${hallsCount}`);
    console.log(`   • Cafeterias:       ${cafeteriasCount}`);
    console.log(`   • Dining Tables:    ${tablesCount}`);
    console.log(`   • Menu Categories:  ${categoriesCount}`);
    console.log(`   • Menu Items:       ${menuItemsCount}`);
    console.log(`   • Inventory Items:  ${inventoryCount}`);
    console.log(`   • Users:            ${usersCount}`);
    console.log("---------------------------------------------");
    console.log("🎉 All Phase 2 database checks passed successfully!");
  } catch (error) {
    console.error("❌ Database Connection Test Failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
