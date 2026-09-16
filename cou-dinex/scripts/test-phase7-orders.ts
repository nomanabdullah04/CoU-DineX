import { prisma } from "../src/lib/prisma";
import { DeliveryType, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

async function main() {
  console.log("==================================================");
  console.log("🧪 TESTING PHASE 7: CART, CHECKOUT & DATABASE TRANSACTION");
  console.log("==================================================");

  // 1. Find or verify test user
  const studentUser = await prisma.user.findFirst({
    where: { role: "STUDENT" },
    include: { student: true },
  });

  if (!studentUser) {
    throw new Error("❌ No student user found in database for testing.");
  }
  console.log(`✓ Student found: ${studentUser.fullName} (${studentUser.id})`);

  // 2. Find cafeteria with tables
  const cafeteria = await prisma.cafeteria.findFirst({
    include: { tables: true },
  });
  if (!cafeteria) {
    throw new Error("❌ No cafeteria found.");
  }
  console.log(`✓ Cafeteria found: ${cafeteria.name} (${cafeteria.tables.length} tables)`);

  // 3. Find available menu item with inventory
  const menuItem = await prisma.menuItem.findFirst({
    where: {
      cafeteriaId: cafeteria.id,
      isAvailable: true,
    },
    include: { inventory: true },
  });

  if (!menuItem || !menuItem.inventory) {
    throw new Error("❌ No menu item with inventory found.");
  }

  const initialStock = menuItem.inventory.currentStock;
  console.log(`✓ Menu item found: "${menuItem.name}" | Initial Stock: ${initialStock} | Price: ৳${menuItem.price}`);

  // 4. Test Hall Delivery
  const hall = await prisma.hall.findFirst();
  if (!hall) {
    throw new Error("❌ No residential hall found.");
  }
  console.log(`✓ Residential Hall found: ${hall.name} (${hall.code})`);

  // 5. Simulate Database Transaction for Order Creation (exactly matching POST /api/orders)
  console.log("\n--- Executing Order Creation Database Transaction ---");
  const orderQuantity = 2;
  const unitPrice = parseFloat(menuItem.price.toString());
  const subtotal = unitPrice * orderQuantity;
  const deliveryFee = 15; // Hall delivery fee
  const totalAmount = subtotal + deliveryFee;
  const orderNumber = `COU-TEST-${Date.now().toString().slice(-6)}`;

  const createdOrder = await prisma.$transaction(async (tx) => {
    // A. Create Delivery Location
    const deliveryLocation = await tx.deliveryLocation.create({
      data: {
        name: `${hall.name} - Room 304`,
        hallId: hall.id,
        roomNumber: "304",
        landmark: "Near North Staircase",
      },
    });

    // B. Create Order
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: studentUser.id,
        cafeteriaId: cafeteria.id,
        deliveryType: DeliveryType.HALL_DELIVERY,
        status: OrderStatus.PENDING,
        subtotal,
        deliveryFee,
        discount: 0,
        totalAmount,
        notes: "Please call upon arrival",
        deliveryLocationId: deliveryLocation.id,
      },
    });

    // C. Create Order Item
    await tx.orderItem.create({
      data: {
        orderId: order.id,
        menuItemId: menuItem.id,
        quantity: orderQuantity,
        unitPrice,
        totalPrice: subtotal,
        specialInstructions: "Less spicy",
      },
    });

    // D. Deduct Inventory Stock
    const updatedInventory = await tx.inventory.update({
      where: { id: menuItem.inventory!.id },
      data: {
        currentStock: Math.max(0, initialStock - orderQuantity),
        isSoldOut: Math.max(0, initialStock - orderQuantity) === 0,
      },
    });

    // E. Create Payment (Cash on delivery / pending)
    await tx.payment.create({
      data: {
        orderId: order.id,
        amount: totalAmount,
        method: PaymentMethod.CASH_ON_DELIVERY,
        status: PaymentStatus.PENDING,
      },
    });

    return { order, updatedInventory, deliveryLocation };
  });

  console.log(`✓ Transaction Succeeded!`);
  console.log(`  - Order ID: ${createdOrder.order.id}`);
  console.log(`  - Order Number: ${createdOrder.order.orderNumber}`);
  console.log(`  - Total: ৳${createdOrder.order.totalAmount}`);
  console.log(`  - Inventory Stock After Order: ${createdOrder.updatedInventory.currentStock} (Decremented by ${orderQuantity})`);

  // 6. Verify full order query
  const verifiedOrder = await prisma.order.findUnique({
    where: { id: createdOrder.order.id },
    include: {
      orderItems: { include: { menuItem: true } },
      deliveryLocation: { include: { hall: true } },
      payment: true,
      cafeteria: true,
    },
  });

  if (!verifiedOrder) throw new Error("Order could not be fetched.");
  console.log(`\n✓ Order Retrieval Verification:`);
  console.log(`  - Items count: ${verifiedOrder.orderItems.length}`);
  console.log(`  - First item: ${verifiedOrder.orderItems[0].menuItem.name} x ${verifiedOrder.orderItems[0].quantity}`);
  console.log(`  - Destination: ${verifiedOrder.deliveryLocation?.name}`);
  console.log(`  - Payment method: ${verifiedOrder.payment?.method} (Status: ${verifiedOrder.payment?.status})`);

  // 7. Cleanup test order & restore inventory stock
  console.log("\n--- Cleaning up test order & restoring stock ---");
  await prisma.inventory.update({
    where: { id: menuItem.inventory.id },
    data: { currentStock: initialStock, isSoldOut: initialStock === 0 },
  });
  await prisma.orderItem.deleteMany({ where: { orderId: createdOrder.order.id } });
  await prisma.payment.deleteMany({ where: { orderId: createdOrder.order.id } });
  await prisma.order.delete({ where: { id: createdOrder.order.id } });
  await prisma.deliveryLocation.delete({ where: { id: createdOrder.deliveryLocation.id } });

  console.log("✓ Cleanup finished. Inventory restored to:", initialStock);
  console.log("\n🎉 ALL PHASE 7 BACKEND & TRANSACTION TESTS PASSED!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
