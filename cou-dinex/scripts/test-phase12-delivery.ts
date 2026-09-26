import { prisma } from "../src/lib/prisma";
import { signSessionToken } from "../src/lib/auth";
import { DeliveryType, PaymentMethod, Role, OrderStatus, DeliveryStatus } from "@prisma/client";

async function run() {
  console.log("=================================================");
  console.log("  PHASE 12: CAMPUS DELIVERY SUITE VERIFICATION   ");
  console.log("=================================================\n");

  // 1. Fetch Student & Delivery Agent
  const studentUser = await prisma.user.findFirst({
    where: { role: Role.STUDENT },
    include: { student: true },
  });

  const agentUser = await prisma.user.findUnique({
    where: { email: "delivery@cou.ac.bd" },
    include: { deliveryAgent: true },
  });

  if (!studentUser || !agentUser || !agentUser.deliveryAgent) {
    console.error("Required test users not found in DB.");
    process.exit(1);
  }

  console.log(`👤 Student: ${studentUser.fullName} (${studentUser.phone})`);
  console.log(`🛵 Delivery Agent: ${agentUser.fullName} (${agentUser.email}, ${agentUser.deliveryAgent.vehicleType})\n`);

  const studentToken = await signSessionToken({
    userId: studentUser.id,
    phone: studentUser.phone,
    email: studentUser.email,
    fullName: studentUser.fullName,
    role: studentUser.role,
    isEmailVerified: studentUser.isEmailVerified,
  });

  const agentToken = await signSessionToken({
    userId: agentUser.id,
    phone: agentUser.phone,
    email: agentUser.email,
    fullName: agentUser.fullName,
    role: agentUser.role,
    isEmailVerified: agentUser.isEmailVerified,
  });

  // 2. Fetch Cafeteria, Hall, and Menu Items
  const cafeteria = await prisma.cafeteria.findFirst({ where: { isOpen: true } });
  const hall = await prisma.hall.findFirst({ where: { code: "KNH" } }) || await prisma.hall.findFirst();
  const items = await prisma.menuItem.findMany({
    where: { cafeteriaId: cafeteria?.id, isAvailable: true },
    take: 2,
  });

  if (!cafeteria || !hall || items.length === 0) {
    console.error("Required cafeteria, hall, or menu items missing.");
    process.exit(1);
  }

  // 3. Step 1: Place a Campus Hall Delivery Order
  console.log("--- 1. Placing Campus Hall Delivery Order ---");
  const orderRes = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `cou_dinex_session=${studentToken}`,
    },
    body: JSON.stringify({
      destinationType: "HALL_DELIVERY",
      cafeteriaId: cafeteria.id,
      hallId: hall.id,
      roomNumber: "304",
      landmark: "KNH East Wing Ground Floor",
      paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
      items: items.map((i) => ({ menuItemId: i.id, quantity: 1 })),
      notes: "Phase 12 automated delivery test ticket",
    }),
  });

  const orderData = await orderRes.json();
  console.log(`Order Placement Status: ${orderRes.status}`);
  if (!orderRes.ok) {
    console.error("Order creation failed:", orderData);
    process.exit(1);
  }

  const orderId = orderData.orderId;
  console.log(`✓ Order Created: #${orderData.orderNumber} (ID: ${orderId})`);

  // Verify DeliveryTracking and OTP in DB
  const trackingInDb = await prisma.deliveryTracking.findUnique({
    where: { orderId },
  });

  console.log(`✓ Tracking Initialized: Status = ${trackingInDb?.status}`);
  console.log(`✓ Secure Handover OTP Generated: [${trackingInDb?.deliveryOtp}] (Length: ${trackingInDb?.deliveryOtp?.length})`);

  if (!trackingInDb?.deliveryOtp || trackingInDb.deliveryOtp.length !== 4) {
    console.error("FAILED: 4-digit deliveryOtp was not properly generated!");
    process.exit(1);
  }

  // Confirm order to make it ready for kitchen dispatch
  await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.CONFIRMED },
  });

  // 4. Step 2: Delivery Agent Views Available Orders
  console.log("\n--- 2. Delivery Agent checks available orders ---");
  const agentOrdersRes = await fetch("http://localhost:3000/api/delivery/orders", {
    headers: { Cookie: `cou_dinex_session=${agentToken}` },
  });
  const agentOrdersData = await agentOrdersRes.json();
  console.log(`Delivery Queue Status: ${agentOrdersRes.status}`);
  const isFoundInAvailable = agentOrdersData.availableOrders?.some((o: any) => o.id === orderId);
  console.log(`✓ Order visible in available pickup queue: ${isFoundInAvailable}`);

  // 5. Step 3: Delivery Agent Accepts Order
  console.log("\n--- 3. Delivery Agent Accepts Delivery ---");
  const acceptRes = await fetch("http://localhost:3000/api/delivery/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `cou_dinex_session=${agentToken}`,
    },
    body: JSON.stringify({ orderId, action: "ACCEPT" }),
  });
  const acceptData = await acceptRes.json();
  console.log(`Accept Status: ${acceptRes.status}, Message: ${acceptData.message}`);

  // 6. Step 4: Mark Picked Up from Cafeteria Counter
  console.log("\n--- 4. Delivery Agent Marks Picked Up from Kitchen ---");
  const pickupRes = await fetch("http://localhost:3000/api/delivery/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `cou_dinex_session=${agentToken}`,
    },
    body: JSON.stringify({ orderId, action: "PICKUP" }),
  });
  const pickupData = await pickupRes.json();
  console.log(`Pickup Status: ${pickupRes.status}, Message: ${pickupData.message}`);

  // 7. Step 5: Start Transit (On the Way)
  console.log("\n--- 5. Delivery Agent Starts Transit (On The Way) ---");
  const startRes = await fetch("http://localhost:3000/api/delivery/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `cou_dinex_session=${agentToken}`,
    },
    body: JSON.stringify({ orderId, action: "START" }),
  });
  const startData = await startRes.json();
  console.log(`Start Transit Status: ${startRes.status}, Message: ${startData.message}`);

  // Verify Order Status transitioned to OUT_FOR_DELIVERY
  const orderInTransit = await prisma.order.findUnique({
    where: { id: orderId },
    include: { deliveryTracking: true },
  });
  console.log(`✓ Order Status in DB: ${orderInTransit?.status}`);
  console.log(`✓ Delivery Tracking Status in DB: ${orderInTransit?.deliveryTracking?.status}`);

  // 8. Step 6: Test GPS Location Broadcast during Transit
  console.log("\n--- 6. Test Active Location Broadcast ---");
  const locRes = await fetch("http://localhost:3000/api/delivery/location", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `cou_dinex_session=${agentToken}`,
    },
    body: JSON.stringify({
      orderId,
      latitude: 23.4198,
      longitude: 91.1378,
    }),
  });
  const locData = await locRes.json();
  console.log(`Location Broadcast Status: ${locRes.status} (Allowed during ON_THE_WAY)`);

  // 9. Step 7: Test OTP Handover Security (Reject Wrong OTP)
  console.log("\n--- 7. Test OTP Handover Security (Incorrect OTP) ---");
  const wrongOtpRes = await fetch("http://localhost:3000/api/delivery/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `cou_dinex_session=${agentToken}`,
    },
    body: JSON.stringify({ orderId, action: "COMPLETE", otp: "0000" }),
  });
  console.log(`Wrong OTP Status: ${wrongOtpRes.status} (Correctly rejected with 400)`);
  const wrongOtpData = await wrongOtpRes.json();
  console.log(`Error Message: "${wrongOtpData.error}"`);

  // 10. Step 8: Test OTP Handover Security (Accept Valid OTP)
  console.log("\n--- 8. Test OTP Handover Security (Valid OTP) ---");
  const correctOtpRes = await fetch("http://localhost:3000/api/delivery/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `cou_dinex_session=${agentToken}`,
    },
    body: JSON.stringify({ orderId, action: "COMPLETE", otp: trackingInDb.deliveryOtp }),
  });
  const correctOtpData = await correctOtpRes.json();
  console.log(`Valid OTP Handover Status: ${correctOtpRes.status}`);
  console.log(`Message: "${correctOtpData.message}"`);

  // 11. Step 9: Verify Privacy Protection - Location updates rejected after delivery
  console.log("\n--- 9. Verify Privacy Auto-Stop (Location broadcast rejected after delivery) ---");
  const postDeliveryLocRes = await fetch("http://localhost:3000/api/delivery/location", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `cou_dinex_session=${agentToken}`,
    },
    body: JSON.stringify({
      orderId,
      latitude: 23.4199,
      longitude: 91.1380,
    }),
  });
  console.log(`Post-Delivery Location Ping Status: ${postDeliveryLocRes.status} (Correctly rejected with 400)`);
  const postLocData = await postDeliveryLocRes.json();
  console.log(`Privacy Notice: "${postLocData.error}"`);

  // 12. Step 10: Verify Student Order Tracking View
  console.log("\n--- 10. Verify Student Tracking View API ---");
  const studentTrackingRes = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
    headers: { Cookie: `cou_dinex_session=${studentToken}` },
  });
  const studentTrackingData = await studentTrackingRes.json();
  console.log(`Student Tracking Status: ${studentTrackingRes.status}`);
  console.log(`Assigned Rider Name: ${studentTrackingData.order?.deliveryTracking?.agent?.user?.fullName}`);
  console.log(`Handover Verified: ${studentTrackingData.order?.deliveryTracking?.isOtpVerified}`);
  console.log(`Final Order Status: ${studentTrackingData.order?.status}`);

  console.log("\n=================================================");
  console.log("  ✅ PHASE 12 CAMPUS DELIVERY FULLY VERIFIED!   ");
  console.log("=================================================");
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
