import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "cou_dinex_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "cou-dinex-dev-only-secret-do-not-use-in-production"
);

// Routes strictly requiring ADMIN role
const ADMIN_ROUTES = ["/admin"];

// Routes requiring authentication for any role
const AUTH_REQUIRED_ROUTES = [
  "/profile",
  "/settings",
  "/cart",
  "/checkout",
  "/orders",
  "/student",
  "/kitchen",
  "/delivery",
];

// Auth pages (redirect if already logged in)
const AUTH_PAGES = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  let isAuthenticated = false;
  let userRole: string | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
      userRole = (payload as any).role || null;
    } catch {
      isAuthenticated = false;
    }
  }

  // 1. Root route ("/") — if logged in, send directly to role default
  if (pathname === "/") {
    if (isAuthenticated) {
      if (userRole === "DELIVERY_AGENT") {
        return NextResponse.redirect(new URL("/delivery", req.url));
      }
      if (userRole === "CAFETERIA_STAFF") {
        return NextResponse.redirect(new URL("/kitchen", req.url));
      }
      if (userRole === "SUPER_ADMIN" || userRole === "CAFETERIA_ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.redirect(new URL("/home", req.url));
    }
    return NextResponse.next();
  }

  // 2. Admin routes check (strictly require admin role)
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (isAdminRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== "SUPER_ADMIN" && userRole !== "CAFETERIA_ADMIN") {
      return NextResponse.redirect(new URL("/home?error=unauthorized_admin", req.url));
    }
    return NextResponse.next();
  }

  // 3. Kitchen routes (require auth; if logged in as student, allow page to display portal with 1-click switch)
  if (pathname === "/kitchen" || pathname.startsWith("/kitchen/")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 4. Delivery routes (strictly require DELIVERY_AGENT or SUPER_ADMIN role)
  if (pathname === "/delivery" || pathname.startsWith("/delivery/")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== "DELIVERY_AGENT" && userRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/home?error=unauthorized_delivery", req.url));
    }
    return NextResponse.next();
  }

  // 5. Operational role redirect for customer ordering routes
  const CUSTOMER_ONLY_ROUTES = ["/home", "/explore", "/campus-map", "/cart", "/checkout"];
  const isCustomerRoute = CUSTOMER_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isCustomerRoute && isAuthenticated) {
    if (userRole === "DELIVERY_AGENT") {
      return NextResponse.redirect(new URL("/delivery", req.url));
    }
    if (userRole === "CAFETERIA_STAFF") {
      return NextResponse.redirect(new URL("/kitchen", req.url));
    }
  }

  // 6. Auth-required routes (profile, settings, orders, etc.)
  const isAuthRequired = AUTH_REQUIRED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isAuthRequired && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 7. Auth pages (login, register) — redirect logged-in users away from login
  const isAuthPage = AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));
  if (isAuthPage && isAuthenticated) {
    const callback = req.nextUrl.searchParams.get("callbackUrl");
    if (callback && callback !== "/" && !callback.startsWith("/login")) {
      // Prevent role-mismatch callback redirects (e.g. student trapped in /kitchen callback)
      const isStudent = userRole === "STUDENT" || userRole === "VISITOR" || userRole === "FACULTY" || userRole === "STAFF";
      if (isStudent && (callback.startsWith("/kitchen") || callback.startsWith("/delivery") || callback.startsWith("/admin"))) {
        return NextResponse.redirect(new URL("/home", req.url));
      }
      if (userRole === "DELIVERY_AGENT" && (callback.startsWith("/kitchen") || callback.startsWith("/admin"))) {
        return NextResponse.redirect(new URL("/delivery", req.url));
      }
      if (userRole === "CAFETERIA_STAFF" && (callback.startsWith("/delivery") || callback.startsWith("/admin"))) {
        return NextResponse.redirect(new URL("/kitchen", req.url));
      }
      return NextResponse.redirect(new URL(callback, req.url));
    }
    if (userRole === "CAFETERIA_STAFF") {
      return NextResponse.redirect(new URL("/kitchen", req.url));
    }
    if (userRole === "SUPER_ADMIN" || userRole === "CAFETERIA_ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (userRole === "DELIVERY_AGENT") {
      return NextResponse.redirect(new URL("/delivery", req.url));
    }
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/admin",
    "/admin/:path*",
    "/kitchen",
    "/kitchen/:path*",
    "/delivery",
    "/delivery/:path*",
    "/home",
    "/home/:path*",
    "/explore",
    "/explore/:path*",
    "/campus-map",
    "/campus-map/:path*",
    "/cart",
    "/cart/:path*",
    "/checkout",
    "/checkout/:path*",
    "/orders",
    "/orders/:path*",
    "/profile",
    "/profile/:path*",
    "/settings",
    "/settings/:path*",
    "/login",
    "/register",
    "/register/:path*",
  ],
};
