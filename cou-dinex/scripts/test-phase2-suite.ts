import { PrismaClient, Role, StudentVerificationStatus, VerificationMethod, OrderStatus, PaymentMethod, PaymentStatus, DeliveryType } from "@prisma/client";

const prisma = new PrismaClient();

async function runTestSuite() {
  console.log("========================================================");
  console.log("🧪 CoU DineX — Comprehensive Phase 2 Database Test Suite");
  console.log("========================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${testName} ${detail ? `(${detail})` : ""}`);
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `(${detail})` : ""}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Database Connectivity & Timezone
    // -------------------------------------------------------------
    console.log("--- 1. Testing Connection & Latency ---");
    const tStart = Date.now();
    const rawResult = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() as now;`;
    const latency = Date.now() - tStart;
    assert(rawResult.length > 0 && !!rawResult[0].now, "Raw Postgres Query Execution", `Latency: ${latency}ms`);

    // -------------------------------------------------------------
    // TEST 2: Seed Data Validation (Departments & Halls)
    // -------------------------------------------------------------
    console.log("\n--- 2. Validating Comilla University Campus Entities ---");
    const departments = await prisma.department.findMany({ orderBy: { code: "asc" } });
    assert(departments.length >= 8, "Departments Seeded", `Found ${departments.length} departments (CSE, ICT, etc.)`);

    const cseDept = departments.find((d) => d.code === "CSE");
    assert(!!cseDept && cseDept.name.includes("Computer Science"), "CSE Department Verified", cseDept?.name);

    const halls = await prisma.hall.findMany();
    assert(halls.length >= 5, "Residential Halls Seeded", `Found ${halls.length} halls`);

    const nazrulHall = halls.find((h) => h.code === "KNH");
    assert(!!nazrulHall && nazrulHall.type === "MALE", "Kazi Nazrul Islam Hall Verified", nazrulHall?.name);

    // -------------------------------------------------------------
    // TEST 3: Cafeteria, Dining Tables & QR Codes
    // -------------------------------------------------------------
    console.log("\n--- 3. Validating Cafeteria & QR Dining Tables ---");
    const cafeteria = await prisma.cafeteria.findUnique({
      where: { slug: "central-cafeteria" },
      include: {
        tables: { orderBy: { tableNumber: "asc" } },
        menuCategories: true,
      },
    });
    assert(!!cafeteria, "Central Cafeteria Exists", cafeteria?.name);
    assert((cafeteria?.tables.length ?? 0) >= 10, "Dining Tables QR Seeding", `Found ${cafeteria?.tables.length} tables`);
    assert(cafeteria?.tables[0]?.qrCode.startsWith("COU-DINEX-TABLE"), "Table QR Code Format", cafeteria?.tables[0]?.qrCode);

    // -------------------------------------------------------------
    // TEST 4: Menu Items & Inventory Integration
    // -------------------------------------------------------------
    console.log("\n--- 4. Validating Menu Catalog & Inventory ---");
    const menuItems = await prisma.menuItem.findMany({
      where: { cafeteriaId: cafeteria!.id },
      include: {
        category: true,
        inventory: true,
      },
    });
    assert(menuItems.length >= 8, "Menu Items Seeded", `Found ${menuItems.length} items`);

    const biryani = menuItems.find((m) => m.name.includes("Biryani"));
    assert(!!biryani && Number(biryani.price) === 120, "Biryani Item with Decimal Price", `Price: ৳${biryani?.price}`);
    assert(Boolean(biryani?.inventory && biryani.inventory.currentStock > 0), "Inventory Relation Verified", `Stock: ${biryani?.inventory?.currentStock}`);

    // -------------------------------------------------------------
    // TEST 5: User & Student Models with Official DB Integration
    // -------------------------------------------------------------
    console.log("\n--- 5. Testing Student Verification & Official DB Extensibility ---");
    const testPhone = `+8801700${Math.floor(100000 + Math.random() * 900000)}`;
    const testStudentId = `COU-TEST-${Date.now().toString().slice(-6)}`;

    // Create a demo student
    const testUser = await prisma.user.create({
      data: {
        phone: testPhone,
        fullName: "Test Student (CoU Phase 2)",
        email: `student.${Date.now()}@cou.ac.bd`,
        role: Role.STUDENT,
        student: {
          create: {
            universityStudentId: testStudentId,
            batch: "14th Batch",
            session: "2019-2020",
            departmentId: cseDept!.id,
            hallId: nazrulHall!.id,
            verificationStatus: StudentVerificationStatus.PENDING,
            verificationMethod: VerificationMethod.OFFICIAL_DATABASE,
            // Official University DB integration fields
            isSyncedWithOfficialDb: true,
            officialDbSyncId: `UDB-SYNC-${Date.now()}`,
            lastSyncedAt: new Date(),
            officialDbRawData: {
              regNumber: "11908001",
              faculty: "Engineering",
              status: "ACTIVE_STUDENT",
            },
          },
        },
      },
      include: {
        student: {
          include: {
            department: true,
            hall: true,
          },
        },
      },
    });

    assert(!!testUser.id && testUser.id.length === 36, "UUID Primary Key Generated for User", testUser.id);
    assert(!!testUser.student && testUser.student.id.length === 36, "UUID Primary Key Generated for Student", testUser.student?.id);
    assert(testUser.student?.department.code === "CSE", "Student -> Department Relation", testUser.student?.department.name);
    assert(testUser.student?.hall?.code === "KNH", "Student -> Hall Relation", testUser.student?.hall?.name);
    assert(testUser.student?.verificationStatus === StudentVerificationStatus.PENDING, "Verification Status Enum (PENDING)");
    assert(testUser.student?.isSyncedWithOfficialDb === true, "Official University DB Sync Flag");

    // Test updating verification status
    const updatedStudent = await prisma.student.update({
      where: { id: testUser.student!.id },
      data: {
        verificationStatus: StudentVerificationStatus.APPROVED,
        verifiedAt: new Date(),
        verifiedBy: "ADMIN_OFFICE",
      },
    });
    assert(updatedStudent.verificationStatus === StudentVerificationStatus.APPROVED, "Student Verification Transition to APPROVED");

    // -------------------------------------------------------------
    // TEST 6: Order, OrderItems & Payment Transaction
    // -------------------------------------------------------------
    console.log("\n--- 6. Testing Order Lifecycle & Relations ---");
    const testOrderNumber = `ORD-TEST-${Date.now()}`;
    const testOrder = await prisma.order.create({
      data: {
        orderNumber: testOrderNumber,
        userId: testUser.id,
        cafeteriaId: cafeteria!.id,
        deliveryType: DeliveryType.TABLE_QR,
        tableId: cafeteria!.tables[0].id,
        status: OrderStatus.CONFIRMED,
        subtotal: 120.0,
        deliveryFee: 0.0,
        totalAmount: 120.0,
        notes: "Test table order",
        orderItems: {
          create: [
            {
              menuItemId: biryani!.id,
              quantity: 1,
              unitPrice: 120.0,
              totalPrice: 120.0,
              specialInstructions: "Extra salad please",
            },
          ],
        },
        payment: {
          create: {
            amount: 120.0,
            method: PaymentMethod.BKASH,
            status: PaymentStatus.PAID,
            transactionId: `TRX-TEST-${Date.now()}`,
            paidAt: new Date(),
          },
        },
      },
      include: {
        orderItems: { include: { menuItem: true } },
        payment: true,
        table: true,
      },
    });

    assert(!!testOrder.id, "Order Created with UUID", testOrder.id);
    assert(testOrder.orderItems.length === 1, "OrderItem Relation Verified", testOrder.orderItems[0].menuItem.name);
    assert(testOrder.payment?.status === PaymentStatus.PAID, "Payment Relation & Status Verified", `৳${testOrder.payment?.amount}`);
    assert(testOrder.table?.tableNumber === "T-01", "Table QR Association Verified", testOrder.table?.tableNumber);

    // -------------------------------------------------------------
    // TEST 7: Clean-Up & Cascade Verification
    // -------------------------------------------------------------
    console.log("\n--- 7. Testing Cascades & Clean-up ---");
    // Delete test user — cascade should clean student, order, orderItem, payment
    await prisma.order.delete({ where: { id: testOrder.id } });
    await prisma.user.delete({ where: { id: testUser.id } });

    const orphanedStudent = await prisma.student.findUnique({ where: { id: testUser.student!.id } });
    assert(orphanedStudent === null, "User Cascade Cleanup Verified", "Student deleted when User removed");

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log("\n========================================================");
    console.log(`🎉 ALL TESTS PASSED: ${passedTests} / ${totalTests} assertions passed!`);
    console.log("========================================================");
  } catch (err) {
    console.error("\n❌ Test Suite encountered an error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTestSuite();
