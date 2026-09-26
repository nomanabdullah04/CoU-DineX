import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "cou_dinex_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "cou-dinex-secure-university-jwt-secret-key-2026-comilla"
);

// Routes requiring authentication
const PROTECTED_ROUTES = ["/home", "/profile", "/orders", "/settings", "/cart", "/checkout", "/student"];

// Routes strictly requiring ADMIN role
const ADMIN_ROUTES = ["/admin"];

// Routes strictly requiring KITCHEN or ADMIN role
const KITCHEN_ROUTES = ["/kitchen"];

// Routes strictly requiring DELIVERY_AGENT or ADMIN role
const DELIVERY_ROUTES = ["/delivery"];

// Routes meant for students (staff / riders get redirected to their portal)
const STUDENT_ROUTES = [
  "/home",
  "/explore",
  "/cart",
  "/checkout",
  "/orders",
  "/profile",
  "/settings",
  "/rewards",
  "/campus-map",
  "/map",
  "/notifications",
  "/student",
];

// Auth routes (redirect to role default if already logged in)
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

  // 1. Root route ("/") — if logged in, send directly to role dashboard
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

  // 2. Check if navigating to a kitchen route
  const isKitchenRoute = KITCHEN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (isKitchenRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Check if role is kitchen staff or admin
    if (
      userRole !== "CAFETERIA_STAFF" &&
      userRole !== "CAFETERIA_ADMIN" &&
      userRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/home?error=unauthorized_kitchen", req.url));
    }
    return NextResponse.next();
  }

  // 3. Check if navigating to an admin route
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (isAdminRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Check if role is admin
    if (userRole !== "SUPER_ADMIN" && userRole !== "CAFETERIA_ADMIN") {
      return NextResponse.redirect(new URL("/home?error=unauthorized_admin", req.url));
    }
    return NextResponse.next();
  }

  // 4. Check if navigating to a delivery agent route
  const isDeliveryRoute = DELIVERY_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (isDeliveryRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Check if role is delivery agent or admin
    if (
      userRole !== "DELIVERY_AGENT" &&
      userRole !== "CAFETERIA_ADMIN" &&
      userRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/home?error=unauthorized_delivery", req.url));
    }
    return NextResponse.next();
  }

  // 5. Check if navigating to a student route
  const isStudentRoute = STUDENT_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (isStudentRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Kitchen staff should always be redirected to kitchen display
    if (userRole === "CAFETERIA_STAFF") {
      return NextResponse.redirect(new URL("/kitchen", req.url));
    }
    // Delivery agent should always be redirected to delivery portal
    if (userRole === "DELIVERY_AGENT") {
      return NextResponse.redirect(new URL("/delivery", req.url));
    }
    // Admin should always be redirected to admin dashboard
    if (userRole === "SUPER_ADMIN" || userRole === "CAFETERIA_ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  // 6. Check if logged-in user is accessing login or register pages
  const isAuthPage = AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));
  if (isAuthPage && isAuthenticated) {
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
    "/orders",
    "/orders/:path*",
    "/cart",
    "/cart/:path*",
    "/checkout",
    "/checkout/:path*",
    "/profile",
    "/profile/:path*",
    "/settings",
    "/settings/:path*",
    "/rewards",
    "/rewards/:path*",
    "/campus-map",
    "/campus-map/:path*",
    "/map",
    "/map/:path*",
    "/notifications",
    "/notifications/:path*",
    "/student",
    "/student/:path*",
    "/login",
    "/register",
    "/register/:path*",
  ],
};
