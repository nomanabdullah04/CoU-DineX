import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export function checkAdminRole(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.CAFETERIA_ADMIN;
}

export function checkSuperAdminRole(role: Role): boolean {
  return role === Role.SUPER_ADMIN;
}

export async function requireAdminSession() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized. Sign in required." }, { status: 401 }), user: null };
  }
  if (!checkAdminRole(user.role)) {
    return { error: NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 }), user: null };
  }
  return { error: null, user };
}

export async function requireSuperAdminSession() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized. Sign in required." }, { status: 401 }), user: null };
  }
  if (!checkSuperAdminRole(user.role)) {
    return { error: NextResponse.json({ error: "Forbidden. Super Admin access required." }, { status: 403 }), user: null };
  }
  return { error: null, user };
}

// Mask sensitive information for privacy protection
export function maskPhone(phone?: string | null): string {
  if (!phone) return "—";
  if (phone.length <= 5) return "***";
  return phone.slice(0, 3) + "****" + phone.slice(-2);
}

export function maskEmail(email?: string | null): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const maskedLocal = local.length > 2 ? local.slice(0, 2) + "***" : "***";
  return `${maskedLocal}@${domain}`;
}
