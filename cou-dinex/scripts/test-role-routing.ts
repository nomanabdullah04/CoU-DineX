import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "cou-dinex-secure-university-jwt-secret-key-2026-comilla"
);

async function createToken(userId: string, role: string) {
  return await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

async function testRoute(name: string, url: string, token: string | null, expectedStatus: number, expectedRedirectPrefix?: string) {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Cookie"] = `cou_dinex_session=${token}`;
  }

  const res = await fetch(url, {
    headers,
    redirect: "manual",
  });

  const location = res.headers.get("location") || "";
  const statusOk = res.status === expectedStatus;
  const redirectOk = expectedRedirectPrefix ? location.includes(expectedRedirectPrefix) : true;

  if (statusOk && redirectOk) {
    console.log(`✅ [PASS] ${name} -> status: ${res.status} location: ${location || "none"}`);
    return true;
  } else {
    console.error(`❌ [FAIL] ${name} -> expected status: ${expectedStatus}, got: ${res.status}. Expected redirect containing: '${expectedRedirectPrefix}', got: '${location}'`);
    return false;
  }
}

async function runTests() {
  console.log("=== Testing Role Isolation & Routing Redirection ===");

  const riderToken = await createToken("rider-1", "DELIVERY_AGENT");
  const studentToken = await createToken("student-1", "STUDENT");
  const kitchenToken = await createToken("kitchen-1", "CAFETERIA_STAFF");
  const adminToken = await createToken("admin-1", "SUPER_ADMIN");

  let allPassed = true;

  // 1. Unauthenticated root "/" should be 200 OK (Landing page)
  allPassed = (await testRoute("Guest at /", "http://localhost:3000/", null, 200)) && allPassed;

  // 2. Rider at "/" should redirect to /delivery
  allPassed = (await testRoute("Rider at /", "http://localhost:3000/", riderToken, 307, "/delivery")) && allPassed;

  // 3. Student at "/" should redirect to /home
  allPassed = (await testRoute("Student at /", "http://localhost:3000/", studentToken, 307, "/home")) && allPassed;

  // 4. Rider at "/home" should redirect to /delivery
  allPassed = (await testRoute("Rider at /home", "http://localhost:3000/home", riderToken, 307, "/delivery")) && allPassed;

  // 5. Rider at "/explore" should redirect to /delivery
  allPassed = (await testRoute("Rider at /explore", "http://localhost:3000/explore", riderToken, 307, "/delivery")) && allPassed;

  // 6. Rider at "/campus-map" should redirect to /delivery
  allPassed = (await testRoute("Rider at /campus-map", "http://localhost:3000/campus-map", riderToken, 307, "/delivery")) && allPassed;

  // 7. Student at "/delivery" should redirect to /home
  allPassed = (await testRoute("Student at /delivery", "http://localhost:3000/delivery", studentToken, 307, "/home")) && allPassed;

  // 8. Unauthenticated at "/delivery" should redirect to /login
  allPassed = (await testRoute("Guest at /delivery", "http://localhost:3000/delivery", null, 307, "/login")) && allPassed;

  // 9. Kitchen at "/home" should redirect to /kitchen
  allPassed = (await testRoute("Kitchen at /home", "http://localhost:3000/home", kitchenToken, 307, "/kitchen")) && allPassed;

  // 10. Rider at "/delivery" should be 200 OK
  allPassed = (await testRoute("Rider at /delivery", "http://localhost:3000/delivery", riderToken, 200)) && allPassed;

  // 11. Rider at "/delivery/map" should be 200 OK
  allPassed = (await testRoute("Rider at /delivery/map", "http://localhost:3000/delivery/map", riderToken, 200)) && allPassed;

  if (allPassed) {
    console.log("\n🎉 ALL 11 ROLE ISOLATION TESTS PASSED PERFECTLY!");
    process.exit(0);
  } else {
    console.error("\n❌ Some tests failed.");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
