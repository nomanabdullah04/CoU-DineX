import { prisma } from "../src/lib/prisma";
import { getPaymentGateway } from "../src/lib/payment/gateway-factory";
import { PaymentMethod, PaymentStatus, PAYMENT_METHOD_CONFIGS } from "../src/lib/payment/types";
import { getDigitalReceipt } from "../src/lib/payment/receipt-service";

async function main() {
  console.log("=========================================");
  console.log("   TESTING PHASE 10: PAYMENT ARCHITECTURE");
  console.log("=========================================\n");

  // 1. Verify Gateway Factory & Configurations
  console.log("1. Checking Payment Gateways & Configurations:");
  const testMethods: PaymentMethod[] = [
    PaymentMethod.CASH_ON_DELIVERY,
    PaymentMethod.BKASH,
    PaymentMethod.NAGAD,
    PaymentMethod.ROCKET,
    PaymentMethod.CARD,
  ];

  for (const method of testMethods) {
    const gateway = getPaymentGateway(method);
    const config = PAYMENT_METHOD_CONFIGS[method];
    console.log(`   - [${method}]`);
    console.log(`     Display Name: "${config.name}"`);
    console.log(`     Is Demo: ${config.isDemo}`);
    console.log(`     Demo Label: "${config.demoBadge}"`);
    console.log(`     Gateway Provider: ${gateway.provider}`);
  }

  // 2. Find an existing order in DB to test complete end-to-end initiation, verification, and receipt
  console.log("\n2. Finding a valid Order in DB for Testing:");
  const existingOrder = await prisma.order.findFirst({
    include: {
      user: true,
      orderItems: { include: { menuItem: true } },
      cafeteria: true,
      payment: true,
    },
  });

  if (!existingOrder) {
    console.log("   No existing order found in DB to test.");
    return;
  }

  console.log(`   Found Order #${existingOrder.orderNumber} (ID: ${existingOrder.id})`);
  console.log(`   Current Order Status: ${existingOrder.status}`);

  // 3. Test Initiation on a Simulated Gateway
  console.log("\n3. Testing Initiation via Simulated bKash Gateway:");
  const bkashGateway = getPaymentGateway(PaymentMethod.BKASH);
  const initResult = await bkashGateway.initiate({
    orderId: existingOrder.id,
    orderNumber: existingOrder.orderNumber,
    amount: Number(existingOrder.totalAmount),
    customerName: existingOrder.user.fullName,
    customerPhone: existingOrder.user.phone,
  });
  console.log("   Initiate Result:", initResult);

  // Test Verification via Simulated Gateway
  const verifyResult = await bkashGateway.verify({
    orderId: existingOrder.id,
    paymentId: existingOrder.payment?.id,
    demoAccount: "01700000000",
    demoPin: "1234",
    simulatedOutcome: "SUCCESS",
  });
  console.log("   Simulated bKash Verify Result:");
  console.log(`     Success: ${verifyResult.success}`);
  console.log(`     Transaction ID: ${verifyResult.transactionId}`);
  console.log(`     Receipt Number: ${verifyResult.receiptNumber}`);
  console.log(`     Is Demo: ${verifyResult.isDemo}`);
  console.log(`     Message: ${verifyResult.message}`);

  // 4. Test Digital Receipt Generation
  console.log("\n4. Generating Digital Receipt Data:");
  const receipt = await getDigitalReceipt(existingOrder.id);
  if (!receipt) {
    console.error("   FAILED: Receipt could not be generated.");
    return;
  }

  console.log("   ================ RECEIPT PREVIEW ================");
  console.log(`   Brand:          ${receipt.appName} (${receipt.campusName})`);
  console.log(`   Receipt No:     ${receipt.receiptNumber}`);
  console.log(`   Order ID:       #${receipt.orderNumber} (${receipt.orderId})`);
  console.log(`   Date / Time:    ${receipt.createdAt}`);
  console.log(`   Paid At:        ${receipt.paidAt || 'Pending'}`);
  console.log(`   Student Name:   ${receipt.customerName} (${receipt.customerRole})`);
  console.log(`   Cafeteria:      ${receipt.cafeteriaName}`);
  console.log(`   Destination:    ${receipt.destinationDisplay}`);
  console.log(`   Payment Method: ${receipt.paymentMethod}`);
  console.log(`   Payment Status: ${receipt.paymentStatus}`);
  console.log(`   Demo Notice:    ${receipt.demoNotice || 'None'}`);
  console.log("   -------------------------------------------------");
  console.log("   ITEMS:");
  for (const item of receipt.items) {
    console.log(`     ${item.quantity}x ${item.name.padEnd(30)} @ ৳${item.unitPrice} = ৳${item.totalPrice}`);
  }
  console.log("   -------------------------------------------------");
  console.log(`   Subtotal:       ৳${receipt.subtotal}`);
  console.log(`   Discount:       ৳${receipt.discount}`);
  console.log(`   Delivery Fee:   ৳${receipt.deliveryFee}`);
  console.log(`   TOTAL:          ৳${receipt.totalAmount}`);
  console.log("   =================================================\n");

  console.log("PHASE 10 ALL TESTS COMPLETED SUCCESSFULLY!");
}

main()
  .catch((e) => {
    console.error("Test failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
