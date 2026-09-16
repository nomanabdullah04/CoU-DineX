import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { Role } from "@prisma/client";

export const AUTH_COOKIE_NAME = "cou_dinex_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "cou-dinex-secure-university-jwt-secret-key-2026-comilla"
);

export interface AuthSessionPayload {
  userId: string;
  phone: string;
  email: string | null;
  fullName: string;
  role: Role;
  isEmailVerified: boolean;
  studentId?: string | null;
  studentVerificationStatus?: string | null;
}

/**
 * Hash a plain password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a plain password against a bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a signed JWT session token (valid for 7 days)
 */
export async function signSessionToken(payload: AuthSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT session token
 */
export async function verifySessionToken(token: string): Promise<AuthSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Get current authenticated user from Next.js server cookies
 */
export async function getCurrentUser(): Promise<AuthSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Fetch full user record from database matching the current session
 */
export async function getCurrentDbUser() {
  const session = await getCurrentUser();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      student: {
        include: {
          department: true,
          hall: true,
        },
      },
      visitor: true,
    },
  });
}
