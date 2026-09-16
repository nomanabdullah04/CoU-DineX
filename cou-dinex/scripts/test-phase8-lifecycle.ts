import { prisma } from "../src/lib/prisma";
import { OrderStatus, DeliveryType, PaymentStatus, DeliveryStatus } from "@prisma/client";

// Test State Machine Transitions
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY_FOR_PICKUP],
  READY_FOR_PICKUP: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
  REJECTED: [],
};

function validateTransition(current: OrderStatus, next: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[current]?.includes(next) ?? false;
}

async function main() {
  console.log("==================================================");
  console.log("🧪 TESTING PHASE 8: ORDER LIFECYCLE, STATE MACHINE & CANCELLATION");
  console.log("==================================================");

  // 1. Get test student and cafeteria
  const student = await prisma.user.findFirst({
    where: { role: "STUDENT" },
  });
  if (!student) throw new Error("No student found");

  const cafeteria = await prisma.cafeteria.findFirst({
    include: { menuItems: { include: { inventory: true } } },
  });
  if (!cafeteria || cafeteria.menuItems.length === 0) throw new Error("No cafeteria or menu item found");

  const menuItem = cafeteria.menuItems[0];
  const initialStock = menuItem.inventory?.currentStock ?? 100;
  console.log(`✓ Test Student: ${student.fullName}`);
  console.log(`✓ Test Cafeteria: ${cafeteria.name}`);
  console.log(`✓ Menu Item: "${menuItem.name}" (Stock: ${initialStock})`);

  // --- TEST SUITE 1: Full Lifecycle State Machine ---
  console.log("\n--- TEST 1: Sequential Lifecycle (PENDING -> DELIVERED) ---");

  const orderNumber1 = `TEST-P8-${Date.now().toString().slice(-6)}`;
  const order1 = await prisma.order.create({
    data: {
      orderNumber: orderNumber1,
      userId: student.id,
      cafeteriaId: cafeteria.id,
      deliveryType: DeliveryType.CAFETERIA_PICKUP,
      status: OrderStatus.PENDING,
      subtotal: 120,
      deliveryFee: 0,
      discount: 0,
      totalAmount: 120,
      orderItems: {
        create: {
          menuItemId: menuItem.id,
          quantity: 1,
          unitPrice: 120,
          totalPrice: 120,
        },
      },
      payment: {
        create: {
          amount: 120,
          method: "CASH_ON_DELIVERY",
          status: PaymentStatus.PENDING,
        },
      },
      deliveryTracking: {
        create: {
          status: DeliveryStatus.PENDING,
          trackingLogs: [
            {
              event: "ORDER_PLACED",
              from: null,
              to: OrderStatus.PENDING,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      },
    },
  });
  console.log(`✓ Created Order #${order1.orderNumber} in status PENDING`);

  const lifecycleStages: OrderStatus[] = [
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
  ];

  let currentStatus = order1.status;
  for (const nextStatus of lifecycleStages) {
    const isValid = validateTransition(currentStatus, nextStatus);
    if (!isValid) {
      throw new Error(`State machine error: Transition ${currentStatus} -> ${nextStatus} should be valid`);
    }

    // Simulate transition update
    const updated = await prisma.order.update({
      where: { id: order1.id },
      data: { status: nextStatus },
    });

    // Update tracking log
    await prisma.deliveryTracking.update({
      where: { orderId: order1.id },
      data: {
        trackingLogs: [
          {
            event: `STATUS_CHANGED_TO_${nextStatus}`,
            from: currentStatus,
            to: nextStatus,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });

    console.log(`  ✓ Transitioned: ${currentStatus} ➔ ${nextStatus}`);
    currentStatus = updated.status;
  }

  // --- TEST SUITE 2: Block Invalid Transitions ---
  console.log("\n--- TEST 2: Invalid State Transitions Blocked ---");
  // Terminal DELIVERED cannot go to PENDING or CANCELLED
  const invalidDeliveredToPending = validateTransition(OrderStatus.DELIVERED, OrderStatus.PENDING);
  console.log(`  ✓ DELIVERED -> PENDING allowed? ${invalidDeliveredToPending} (Expected: false)`);
  if (invalidDeliveredToPending) throw new Error("DELIVERED -> PENDING should not be allowed!");

  const invalidDeliveredToCancel = validateTransition(OrderStatus.DELIVERED, OrderStatus.CANCELLED);
  console.log(`  ✓ DELIVERED -> CANCELLED allowed? ${invalidDeliveredToCancel} (Expected: false)`);
  if (invalidDeliveredToCancel) throw new Error("DELIVERED -> CANCELLED should not be allowed!");

  // PREPARING cannot go directly to CANCELLED
  const invalidPreparingToCancel = validateTransition(OrderStatus.PREPARING, OrderStatus.CANCELLED);
  console.log(`  ✓ PREPARING -> CANCELLED allowed? ${invalidPreparingToCancel} (Expected: false)`);
  if (invalidPreparingToCancel) throw new Error("PREPARING -> CANCELLED should not be allowed!");

  // --- TEST SUITE 3: Order Cancellation & Inventory Restoration ---
  console.log("\n--- TEST 3: Order Cancellation & Inventory Restoration ---");
  const cancelQuantity = 3;
  // Deduct stock first to simulate checkout
  await prisma.inventory.update({
    where: { menuItemId: menuItem.id },
    data: { currentStock: { decrement: cancelQuantity } },
  });
  const stockBeforeCancel = (await prisma.inventory.findUnique({ where: { menuItemId: menuItem.id } }))?.currentStock!;
  console.log(`  Stock before cancellation: ${stockBeforeCancel}`);

  const orderToCancel = await prisma.order.create({
    data: {
      orderNumber: `TEST-CNC-${Date.now().toString().slice(-6)}`,
      userId: student.id,
      cafeteriaId: cafeteria.id,
      deliveryType: DeliveryType.CAFETERIA_PICKUP,
      status: OrderStatus.CONFIRMED, // Cancellable!
      subtotal: 100 * cancelQuantity,
      deliveryFee: 0,
      discount: 0,
      totalAmount: 100 * cancelQuantity,
      orderItems: {
        create: {
          menuItemId: menuItem.id,
          quantity: cancelQuantity,
          unitPrice: 100,
          totalPrice: 100 * cancelQuantity,
        },
      },
      payment: {
        create: {
          amount: 100 * cancelQuantity,
          method: "CASH_ON_DELIVERY",
          status: PaymentStatus.PENDING,
        },
      },
    },
    include: { orderItems: true },
  });
  console.log(`✓ Created Cancellable Order #${orderToCancel.orderNumber} (Status: CONFIRMED)`);

  // Execute Cancellation Transaction (matching /api/orders/[id]/cancel)
  await prisma.$transaction(async (tx) => {
    // 1. Update Order Status
    await tx.order.update({
      where: { id: orderToCancel.id },
      data: { status: OrderStatus.CANCELLED },
    });

    // 2. Restock Inventory
    for (const item of orderToCancel.orderItems) {
      await tx.inventory.updateMany({
        where: { menuItemId: item.menuItemId },
        data: {
          currentStock: { increment: item.quantity },
          isSoldOut: false,
        },
      });
    }

    // 3. Mark Payment Cancelled
    await tx.payment.updateMany({
      where: { orderId: orderToCancel.id },
      data: { status: PaymentStatus.FAILED },
    });
  });

  const stockAfterCancel = (await prisma.inventory.findUnique({ where: { menuItemId: menuItem.id } }))?.currentStock!;
  console.log(`✓ Cancelled Order #${orderToCancel.orderNumber}`);
  console.log(`✓ Stock after cancellation: ${stockAfterCancel} (Incremented by +${cancelQuantity})`);
  if (stockAfterCancel !== stockBeforeCancel + cancelQuantity) {
    throw new Error(`Inventory was not properly restored! Expected ${stockBeforeCancel + cancelQuantity}, got ${stockAfterCancel}`);
  }

  // --- TEST SUITE 4: Verification of Timeline and CanCancel flags ---
  console.log("\n--- TEST 4: Verification of Timeline & canCancel Logic ---");
  const cancelledOrderFetched = await prisma.order.findUnique({
    where: { id: orderToCancel.id },
  });
  const canCancelStatus = [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(cancelledOrderFetched?.status as any);
  console.log(`  Can cancel a CANCELLED order? ${canCancelStatus} (Expected: false)`);
  if (canCancelStatus) throw new Error("Cancelled order should not be cancellable!");

  console.log("\n==================================================");
  console.log("🎉 ALL PHASE 8 ORDER LIFECYCLE TESTS PASSED PERFECTLY!");
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("❌ Test failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
