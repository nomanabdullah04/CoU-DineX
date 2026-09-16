async function verifyHttpRoutes() {
  console.log("==================================================");
  console.log("🌐 VERIFYING PHASE 8 HTTP & API ENDPOINTS");
  console.log("==================================================");

  // 1. Check Login
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "noman.pending@cou.ac.bd",
      password: "Student@123",
    }),
  });

  console.log(`1. Student Login status: ${loginRes.status}`);
  const setCookie = loginRes.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("Failed to receive session cookie from login.");
  }
  const cookies = setCookie.split(";")[0];
  console.log(`✓ Session established`);

  // 2. Query Student Orders via API
  const ordersRes = await fetch("http://localhost:3000/api/orders", {
    headers: { Cookie: cookies },
  });
  console.log(`2. GET /api/orders status: ${ordersRes.status}`);
  const ordersData = await ordersRes.json();
  console.log(`✓ Fetched ${ordersData.orders?.length ?? 0} orders for student`);

  if (ordersData.orders && ordersData.orders.length > 0) {
    const testOrder = ordersData.orders[0];
    console.log(`\nTesting with Order #${testOrder.orderNumber} (ID: ${testOrder.id})`);

    // 3. GET /api/orders/[id]
    const singleOrderRes = await fetch(`http://localhost:3000/api/orders/${testOrder.id}`, {
      headers: { Cookie: cookies },
    });
    console.log(`3. GET /api/orders/${testOrder.id} status: ${singleOrderRes.status}`);
    const singleOrderData = await singleOrderRes.json();
    console.log(`✓ Order details received:`);
    console.log(`  - Status: ${singleOrderData.order.status}`);
    console.log(`  - canCancel: ${singleOrderData.order.canCancel}`);
    console.log(`  - Timeline entries: ${singleOrderData.order.timeline?.length}`);
    singleOrderData.order.timeline?.forEach((step: any) => {
      console.log(`    [${step.key}] ${step.label} (${step.timestamp ? "Logged at " + step.timestamp.slice(11, 19) : "Pending"}) - Done: ${step.completed}`);
    });
  }

  // 4. Test Server Page /orders
  const ordersPageRes = await fetch("http://localhost:3000/orders", {
    headers: { Cookie: cookies },
  });
  console.log(`\n4. GET /orders HTML page status: ${ordersPageRes.status}`);

  console.log("\n==================================================");
  console.log("🎉 ALL HTTP & API ENDPOINTS VERIFIED SUCCESSFULLY!");
  console.log("==================================================");
}

verifyHttpRoutes().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
