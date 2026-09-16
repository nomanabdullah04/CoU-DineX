async function main() {
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "kitchen@cou.ac.bd",
      password: "Kitchen@123",
    }),
  });

  const loginData = await loginRes.json();
  console.log("Login Status:", loginRes.status);
  console.log("User Role:", loginData.user?.role);

  const cookie = loginRes.headers.get("set-cookie");
  console.log("Cookie received:", !!cookie);

  if (!cookie) {
    console.error("No cookie returned!");
    return;
  }

  // Extract raw cookie header
  const rawCookie = cookie.split(";")[0];

  // Test 1: Access /home with kitchen cookie -> should redirect to /kitchen
  const homeRes = await fetch("http://localhost:3000/home", {
    headers: { Cookie: rawCookie },
    redirect: "manual",
  });
  console.log("/home Response Status:", homeRes.status, "Location:", homeRes.headers.get("location"));

  // Test 2: Access /login with kitchen cookie -> should redirect to /kitchen
  const loginPageRes = await fetch("http://localhost:3000/login", {
    headers: { Cookie: rawCookie },
    redirect: "manual",
  });
  console.log("/login Response Status:", loginPageRes.status, "Location:", loginPageRes.headers.get("location"));

  // Test 3: Access /kitchen with kitchen cookie -> should be 200 OK
  const kitchenRes = await fetch("http://localhost:3000/kitchen", {
    headers: { Cookie: rawCookie },
    redirect: "manual",
  });
  console.log("/kitchen Response Status:", kitchenRes.status);

  // Test 4: Access /api/kitchen/orders with kitchen cookie -> should return orders
  const ordersRes = await fetch("http://localhost:3000/api/kitchen/orders", {
    headers: { Cookie: rawCookie },
  });
  const ordersData = await ordersRes.json();
  console.log("Kitchen Orders API Status:", ordersRes.status, "Total Active:", ordersData.counts?.totalActive);
}

main().catch(console.error);
