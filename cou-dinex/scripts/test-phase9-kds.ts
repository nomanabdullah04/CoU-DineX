import { prisma } from "../src/lib/prisma";
import { OrderStatus, DeliveryType, PaymentStatus, DeliveryStatus } from "@prisma/client";

async function main() {
  console.log("==================================================");
  console.log("🍳 TESTING PHASE 9: KITCHEN DISPLAY SYSTEM (KDS)");
  console.log("==================================================");

  // 1. Authenticate Student & Kitchen Staff
  console.log("\n--- TEST 1: Role Authorization Verification ---");

  // Login as Student
  const studentLoginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "noman.pending@cou.ac.bd",
      password: "Student@123",
    }),
  });
  const studentCookie = studentLoginRes.headers.get("set-cookie")?.split(";")[0];
  console.log(`  Student Login: ${studentLoginRes.status} (Cookie acquired)`);

  // Student attempts to access KDS API
  const studentKdsRes = await fetch("http://localhost:3000/api/kitchen/orders", {
    headers: { Cookie: studentCookie || "" },
  });
  console.log(`  Student GET /api/kitchen/orders: ${studentKdsRes.status} (Expected: 403 Forbidden)`);
  if (studentKdsRes.status !== 403) {
    throw new Error(`Security Violation: Student was allowed access with status ${studentKdsRes.status}! Expected 403.`);
  }
  console.log("  ✓ Student access strictly blocked with 403 Forbidden");

  // Login as Kitchen Staff
  const kitchenLoginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "kitchen@cou.ac.bd",
      password: "Kitchen@123",
    }),
  });
  const kitchenCookie = kitchenLoginRes.headers.get("set-cookie")?.split(";")[0];
  console.log(`  Kitchen Staff Login: ${kitchenLoginRes.status} (Cookie acquired)`);
  if (!kitchenCookie) throw new Error("Kitchen login failed to return session cookie.");

  // Kitchen Staff accesses KDS API
  const kitchenKdsRes = await fetch("http://localhost:3000/api/kitchen/orders", {
    headers: { Cookie: kitchenCookie },
  });
  console.log(`  Kitchen GET /api/kitchen/orders: ${kitchenKdsRes.status} (Expected: 200 OK)`);
  if (kitchenKdsRes.status !== 200) {
    throw new Error(`Kitchen staff was denied access with status ${kitchenKdsRes.status}!`);
  }
  const initialKdsData = await kitchenKdsRes.json();
  console.log(`  ✓ Kitchen staff authenticated successfully! Active tickets: ${initialKdsData.counts.totalActive}`);

  // 2. Create a Test Order to test Smart Queue & KDS display
  console.log("\n--- TEST 2: Order Creation & Smart Queue Telemetry ---");
  const studentUser = await prisma.user.findFirst({ where: { role: "STUDENT" } });
  const cafeteria = await prisma.cafeteria.findFirst({ include: { menuItems: true, tables: true } });
  if (!studentUser || !cafeteria || cafeteria.menuItems.length === 0) {
    throw new Error("Missing database seed data for student or cafeteria.");
  }

  const table = cafeteria.tables[0];
  const item1 = cafeteria.menuItems[0];
  const item2 = cafeteria.menuItems[1] || item1;

  const testOrderNumber = `KDS-TEST-${Date.now().toString().slice(-5)}`;
  const createdOrder = await prisma.order.create({
    data: {
      orderNumber: testOrderNumber,
      userId: studentUser.id,
      cafeteriaId: cafeteria.id,
      deliveryType: DeliveryType.TABLE_QR,
      tableId: table?.id || null,
      status: OrderStatus.PENDING,
      subtotal: 200,
      deliveryFee: 0,
      discount: 0,
      totalAmount: 200,
      notes: "Urgent: please serve before class starts",
      orderItems: {
        create: [
          {
            menuItemId: item1.id,
            quantity: 2,
            unitPrice: 70,
            totalPrice: 140,
            specialInstructions: "Less spicy please",
          },
          {
            menuItemId: item2.id,
            quantity: 1,
            unitPrice: 60,
            totalPrice: 60,
            specialInstructions: "Extra napkin",
          },
        ],
      },
      payment: {
        create: {
          amount: 200,
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
              timestamp: new Date().toISOString(),
            },
          ],
        },
      },
    },
  });
  console.log(`  ✓ Created Order #${createdOrder.orderNumber} (ID: ${createdOrder.id})`);

  // Query KDS as Kitchen Staff and inspect Smart Queue info
  const kdsAfterCreateRes = await fetch("http://localhost:3000/api/kitchen/orders", {
    headers: { Cookie: kitchenCookie },
  });
  const kdsAfterCreateData = await kdsAfterCreateRes.json();
  const foundTicket = kdsAfterCreateData.orders.newOrders.find((o: any) => o.id === createdOrder.id);

  if (!foundTicket) {
    throw new Error(`Created order #${testOrderNumber} not found in newOrders!`);
  }
  console.log(`  ✓ Ticket successfully displayed in KDS "New Orders":`);
  console.log(`    - Queue Position: ${foundTicket.smartQueue.queuePosition}`);
  console.log(`    - Waiting Time: ${foundTicket.smartQueue.waitingTimeFormatted}`);
  console.log(`    - Est. Prep Time: ${foundTicket.smartQueue.estimatedPrepTimeMinutes} min`);
  console.log(`    - Destination: ${foundTicket.destination.title} (${foundTicket.destination.detail})`);
  console.log(`    - Items count: ${foundTicket.items.length} items (${foundTicket.totalItemCount} qty)`);
  console.log(`    - Special Instructions: "${foundTicket.items[0]?.specialInstructions}"`);

  // 3. Sequential KDS Actions Progression (Accept -> Start Prep -> Mark Ready -> Complete)
  console.log("\n--- TEST 3: Sequential KDS Action Flow ---");

  // 3.1 ACTION: Accept (PENDING -> CONFIRMED)
  console.log("  3.1 Executing Action: Accept Order...");
  const acceptRes = await fetch(`http://localhost:3000/api/orders/${createdOrder.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: kitchenCookie },
    body: JSON.stringify({ status: OrderStatus.CONFIRMED, note: "Accepted at counter" }),
  });
  if (!acceptRes.ok) throw new Error(`Accept action failed: ${acceptRes.statusText}`);
  console.log("  ✓ Action Accepted. State -> CONFIRMED");

  // Verify in KDS
  const kdsConfirmed = await (await fetch("http://localhost:3000/api/kitchen/orders", { headers: { Cookie: kitchenCookie } })).json();
  const isNowConfirmed = kdsConfirmed.orders.confirmed.some((o: any) => o.id === createdOrder.id);
  if (!isNowConfirmed) throw new Error("Order not found in Confirmed column!");
  console.log("  ✓ Order automatically moved to 'Confirmed' stage in KDS");

  // 3.2 ACTION: Start Preparing (CONFIRMED -> PREPARING)
  console.log("  3.2 Executing Action: Start Preparing...");
  const prepRes = await fetch(`http://localhost:3000/api/orders/${createdOrder.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: kitchenCookie },
    body: JSON.stringify({ status: OrderStatus.PREPARING, note: "Chef cooking" }),
  });
  if (!prepRes.ok) throw new Error(`Start Preparing action failed: ${prepRes.statusText}`);
  console.log("  ✓ Action Started. State -> PREPARING");

  const kdsPrep = await (await fetch("http://localhost:3000/api/kitchen/orders", { headers: { Cookie: kitchenCookie } })).json();
  const isNowPreparing = kdsPrep.orders.preparing.some((o: any) => o.id === createdOrder.id);
  if (!isNowPreparing) throw new Error("Order not found in Preparing column!");
  console.log("  ✓ Order automatically moved to 'Preparing' stage in KDS");

  // 3.3 ACTION: Mark Ready (PREPARING -> READY_FOR_PICKUP)
  console.log("  3.3 Executing Action: Mark Ready...");
  const readyRes = await fetch(`http://localhost:3000/api/orders/${createdOrder.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: kitchenCookie },
    body: JSON.stringify({ status: OrderStatus.READY_FOR_PICKUP, note: "Ready for table serve" }),
  });
  if (!readyRes.ok) throw new Error(`Mark Ready action failed: ${readyRes.statusText}`);
  console.log("  ✓ Action Marked Ready. State -> READY_FOR_PICKUP");

  const kdsReady = await (await fetch("http://localhost:3000/api/kitchen/orders", { headers: { Cookie: kitchenCookie } })).json();
  const isNowReady = kdsReady.orders.ready.some((o: any) => o.id === createdOrder.id);
  if (!isNowReady) throw new Error("Order not found in Ready column!");
  console.log("  ✓ Order automatically moved to 'Ready for Pickup' stage in KDS");

  // 3.4 ACTION: Complete Handover (READY_FOR_PICKUP -> DELIVERED)
  console.log("  3.4 Executing Action: Complete Handover...");
  const completeRes = await fetch(`http://localhost:3000/api/orders/${createdOrder.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: kitchenCookie },
    body: JSON.stringify({ status: OrderStatus.DELIVERED, note: "Handed over to student" }),
  });
  if (!completeRes.ok) throw new Error(`Complete action failed: ${completeRes.statusText}`);
  console.log("  ✓ Action Completed. State -> DELIVERED");

  const kdsCompleted = await (await fetch("http://localhost:3000/api/kitchen/orders", { headers: { Cookie: kitchenCookie } })).json();
  const isNowCompleted = kdsCompleted.orders.completed.some((o: any) => o.id === createdOrder.id);
  if (!isNowCompleted) throw new Error("Order not found in Completed column!");
  console.log("  ✓ Order automatically moved to 'Completed' stage in KDS");

  // 4. Verification that Student Tracking Page receives immediate updates
  console.log("\n--- TEST 4: Student Tracking Page Synchronization ---");
  const studentTrackingRes = await fetch(`http://localhost:3000/api/orders/${createdOrder.id}`, {
    headers: { Cookie: studentCookie || "" },
  });
  if (!studentTrackingRes.ok) throw new Error("Failed to fetch student tracking details.");
  const studentTrackingData = await studentTrackingRes.json();
  console.log(`  Student view status: ${studentTrackingData.order.status} (Expected: DELIVERED)`);
  if (studentTrackingData.order.status !== OrderStatus.DELIVERED) {
    throw new Error(`Student view did not receive update! Got: ${studentTrackingData.order.status}`);
  }
  console.log("  ✓ Student tracking page immediately reflected kitchen updates!");

  // 5. Test Invalid Transition Rejection
  console.log("\n--- TEST 5: State Machine Rejection of Invalid Transitions ---");
  const invalidJumpRes = await fetch(`http://localhost:3000/api/orders/${createdOrder.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: kitchenCookie },
    body: JSON.stringify({ status: OrderStatus.PENDING }),
  });
  console.log(`  Attempt DELIVERED -> PENDING: Status ${invalidJumpRes.status} (Expected: 400)`);
  if (invalidJumpRes.status !== 400) {
    throw new Error("Invalid transition DELIVERED -> PENDING was not rejected!");
  }
  const invalidJumpData = await invalidJumpRes.json();
  console.log(`  ✓ Rejection error message: "${invalidJumpData.error}"`);

  console.log("\n==================================================");
  console.log("🎉 ALL PHASE 9 KITCHEN DISPLAY SYSTEM TESTS PASSED!");
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
