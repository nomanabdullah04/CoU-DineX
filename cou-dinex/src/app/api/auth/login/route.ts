import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { verifyPassword, signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

import { AuditAction } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const body = await req.json();

    // 1. Validation
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Please enter your email/phone and password" },
        { status: 400 }
      );
    }

    const { identifier, password } = validationResult.data;

    // 2. Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { phone: identifier },
        ],
      },
      include: {
        student: true,
      },
    });

    if (!user || !user.passwordHash) {
      // Record failed login audit log for security analytics
      try {
        await prisma.auditLog.create({
          data: {
            action: AuditAction.LOGIN,
            entityName: "Auth",
            entityId: "FAILED_USER_NOT_FOUND",
            ipAddress,
            userAgent,
            newValues: { identifier: identifier.slice(0, 3) + "***", status: "FAILED_INVALID_IDENTIFIER" },
          },
        });
      } catch (e) {
        console.error("Audit log error:", e);
      }
      return NextResponse.json(
        { error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // 3. Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      // Record failed password attempt
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: AuditAction.LOGIN,
            entityName: "Auth",
            entityId: user.id,
            ipAddress,
            userAgent,
            newValues: { status: "FAILED_INVALID_PASSWORD", role: user.role },
          },
        });
      } catch (e) {
        console.error("Audit log error:", e);
      }
      return NextResponse.json(
        { error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    // Record successful login audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: AuditAction.LOGIN,
          entityName: "Auth",
          entityId: user.id,
          ipAddress,
          userAgent,
          newValues: { status: "SUCCESS", role: user.role },
        },
      });
    } catch (e) {
      console.error("Audit log error:", e);
    }

    // 4. Create Session
    const sessionToken = await signSessionToken({
      userId: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      studentId: user.student?.id,
      studentVerificationStatus: user.student?.verificationStatus,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        studentVerificationStatus: user.student?.verificationStatus ?? null,
      },
    });

    // Set Cookie
    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}
