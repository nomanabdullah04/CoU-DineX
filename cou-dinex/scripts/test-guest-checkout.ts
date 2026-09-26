import { prisma } from "../src/lib/prisma";
import { signSessionToken } from "../src/lib/auth";
import { PaymentMethod } from "../src/lib/payment/types";

async function run() {
  console.log("=== TESTING GUEST ORDER & PAYMENT WORKFLOW ===");

  // 1. Find visitor user
  const visitor = await prisma.user.findFirst({
    where: { role: "VISITOR" },
    include: { visitor: true },
  });

  if (!visitor) {
    console.error("No visitor found in DB!");
    process.exit(1);
  }

  console.log(`Testing with Visitor: ${visitor.fullName} (${visitor.phone})`);

  // 2. Generate session token
  const token = await signSessionToken({
    userId: visitor.id,
    phone: visitor.phone,
    email: visitor.email,
    fullName: visitor.fullName,
    role: visitor.role,
    isEmailVerified: visitor.isEmailVerified,
  });

  // 3. Find cafeteria & available items
  const cafeteria = await prisma.cafeteria.findFirst({
    where: { isOpen: true },
    include: {
      tables: true,
      menuCategories: {
        include: {
          items: {
            where: { isAvailable: true },
            take: 2,
          },
        },
      },
    },
  });

  if (!cafeteria) {
    console.error("No open cafeteria found!");
    process.exit(1);
  }

  const items = cafeteria.menuCategories.flatMap((c) => c.items);
  if (items.length === 0) {
    console.error("No items found in cafeteria!");
    process.exit(1);
  }

  console.log(`Cafeteria: ${cafeteria.name}, Tables count: ${cafeteria.tables.length}`);
  console.log(`Selected Items: ${items.map((i) => i.name).join(", ")}`);

  // 4. Test Place Order with bKash Demo Payment
  const orderPayload = {
    items: items.map((i) => ({ menuItemId: i.id, quantity: 1 })),
    destinationType: "CAFETERIA_PICKUP",
    cafeteriaId: cafeteria.id,
    paymentMethod: PaymentMethod.BKASH,
  };

  const baseUrl = "http://localhost:3000";

  console.log("\nAttempting POST /api/orders as VISITOR...");
  const orderRes = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `cou_dinex_session=${token}`,
    },
    body: JSON.stringify(orderPayload),
  });

  const orderData = await orderRes.json();
  console.log(`Order Response Status: ${orderRes.status}`);
  console.log("Order Response Data:", orderData);

  if (!orderRes.ok) {
    console.error("FAILED to place order as guest!");
    return;
  }

  const orderId = orderData.orderId;

  // 5. Test Payment Verification
  console.log("\nAttempting POST /api/payments/verify with Demo bKash...");
  const paymentRes = await fetch(`${baseUrl}/api/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `cou_dinex_session=${token}`,
    },
    body: JSON.stringify({
      orderId,
      method: PaymentMethod.BKASH,
      demoAccount: "01712-345678",
      demoPin: "1234",
      simulatedOutcome: "SUCCESS",
    }),
  });

  const paymentData = await paymentRes.json();
  console.log(`Payment Response Status: ${paymentRes.status}`);
  console.log("Payment Response Data:", paymentData);

  // 6. Test Receipt Fetch
  console.log(`\nAttempting GET /api/orders/${orderId}/receipt...`);
  const receiptRes = await fetch(`${baseUrl}/api/orders/${orderId}/receipt`, {
    headers: {
      Cookie: `cou_dinex_session=${token}`,
    },
  });

  const receiptData = await receiptRes.json();
  console.log(`Receipt Response Status: ${receiptRes.status}`);
  console.log("Receipt Summary:", {
    receiptNumber: receiptData.receiptNumber,
    customerName: receiptData.customerName,
    customerRole: receiptData.customerRole,
    paymentStatus: receiptData.paymentStatus,
    paymentMethod: receiptData.paymentMethod,
    totalAmount: receiptData.totalAmount,
  });
}

run().catch(console.error);
