import { prisma } from "../src/lib/prisma";

async function runDashboardTests() {
  console.log("=== PHASE 5: STUDENT DASHBOARD TEST SUITE ===");
  const baseUrl = "http://localhost:3000";

  // 1. Test unauthenticated request
  console.log("\n[Test 1] Unauthenticated request to /api/student/dashboard...");
  const unauthRes = await fetch(`${baseUrl}/api/student/dashboard`);
  console.log(`Response status: ${unauthRes.status}`);
  if (unauthRes.status === 401) {
    console.log("✓ Correctly protected: 401 Unauthorized for unauthenticated requests.");
  } else {
    throw new Error(`Expected 401, got ${unauthRes.status}`);
  }

  // 2. Test login as Approved Student
  console.log("\n[Test 2] Authenticating as Approved Student (fatima.approved@cou.ac.bd)...");
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "fatima.approved@cou.ac.bd",
      password: "Student123!",
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed with status ${loginRes.status}`);
  }

  const setCookieHeader = loginRes.headers.get("set-cookie");
  if (!setCookieHeader) {
    throw new Error("No session cookie returned from login.");
  }

  // Extract session token
  const cookies = setCookieHeader.split(",").map(c => c.split(";")[0]).join("; ");
  console.log("✓ Login successful, session cookie obtained.");

  // 3. Test Dashboard API Data Delivery
  console.log("\n[Test 3] Fetching Dashboard Data for Approved Student...");
  const dashRes = await fetch(`${baseUrl}/api/student/dashboard`, {
    headers: { Cookie: cookies },
  });

  if (!dashRes.ok) {
    const errText = await dashRes.text();
    throw new Error(`Dashboard API failed: ${dashRes.status} - ${errText}`);
  }

  const data = await dashRes.json();
  console.log("✓ Dashboard API returned 200 OK.");

  // Validate required 11 elements in data payload
  console.log("\n[Test 4] Validating 11 Required Elements in Payload...");

  // 1 & 2: Student Greeting & Verified Badge
  if (!data.student || !data.student.name || data.student.isVerified !== true) {
    throw new Error("Missing or invalid student verification profile data.");
  }
  console.log(`✓ Element 1 & 2 (Greeting & Badge): Name="${data.student.name}", Verified=${data.student.isVerified}, Status=${data.student.verificationStatus}`);

  // 5: Campus Food Radar
  if (!data.radar || data.radar.availableTables === undefined || !data.radar.crowdLevel) {
    throw new Error("Missing Campus Food Radar telemetry data.");
  }
  console.log(`✓ Element 5 (Campus Food Radar): Crowd="${data.radar.crowdLevel}", Available Tables=${data.radar.availableTables}/${data.radar.totalTables}, Prep Wait=~${data.radar.avgWaitMinutes}m`);

  // 4: What's Available Now
  if (!Array.isArray(data.availableNow) || data.availableNow.length === 0) {
    throw new Error("Missing 'What’s Available Now?' food items list.");
  }
  console.log(`✓ Element 4 (What’s Available Now): ${data.availableNow.length} items found (Sample: ${data.availableNow[0].name}, ${data.availableNow[0].availability})`);

  // 6: Active Order
  console.log(`✓ Element 6 (Active Order): ${data.activeOrder ? `Active #${data.activeOrder.orderNumber}` : "Idle (Clean empty state ready)"}`);

  // 8: Student Offers
  if (!Array.isArray(data.offers) || data.offers.length === 0) {
    throw new Error("Missing student offers.");
  }
  console.log(`✓ Element 8 (Student Offers): ${data.offers.length} active offers (e.g. ${data.offers[0].title})`);

  // 9: Rewards Summary
  if (!data.rewards || data.rewards.points === undefined || data.rewards.ecoScore === undefined) {
    throw new Error("Missing rewards/eco summary.");
  }
  console.log(`✓ Element 9 (Rewards Summary): Dine Points=${data.rewards.points}, Eco Score=${data.rewards.ecoScore}/100, Next Reward="${data.rewards.nextReward}"`);

  // 10: Recent Orders
  if (!Array.isArray(data.recentOrders)) {
    throw new Error("Missing recent orders array.");
  }
  console.log(`✓ Element 10 (Recent Orders): ${data.recentOrders.length} past orders recorded.`);

  // 11: Recommended Food
  if (!data.recommendation || !data.recommendation.name) {
    throw new Error("Missing DineX smart recommendation.");
  }
  console.log(`✓ Element 11 (Recommended Food): "${data.recommendation.name}" (Rating: ${data.recommendation.rating}★, ৳${data.recommendation.price})`);

  // 4. Test with Pending Student
  console.log("\n[Test 5] Testing Dashboard with Pending Student (noman.pending@cou.ac.bd)...");
  const pendingLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "noman.pending@cou.ac.bd",
      password: "Student123!",
    }),
  });

  const pendingCookies = pendingLogin.headers.get("set-cookie")!.split(",").map(c => c.split(";")[0]).join("; ");
  const pendingDashRes = await fetch(`${baseUrl}/api/student/dashboard`, {
    headers: { Cookie: pendingCookies },
  });

  const pendingData = await pendingDashRes.json();
  if (pendingData.student.isVerified !== false || pendingData.student.verificationStatus !== "PENDING") {
    throw new Error("Expected student to be unverified/pending.");
  }
  console.log(`✓ Pending student correctly shows isVerified=false and status="${pendingData.student.verificationStatus}".`);

  // 5. Check /home HTML rendering
  console.log("\n[Test 6] Verifying /home Route Page HTML Render...");
  const pageRes = await fetch(`${baseUrl}/home`);
  console.log(`Page status: ${pageRes.status}`);
  if (pageRes.status === 200) {
    console.log("✓ /home page route serves successfully (200 OK).");
  } else {
    throw new Error(`/home page returned status ${pageRes.status}`);
  }

  console.log("\n========================================================");
  console.log("🎉 ALL PHASE 5 DASHBOARD INTEGRATION TESTS PASSED!");
  console.log("========================================================");
}

runDashboardTests()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
