import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const callbackUrl = url.searchParams.get("callbackUrl") || "/home";

    // Find or create guest visitor
    let guestUser = await prisma.user.findFirst({
      where: { role: "VISITOR" },
    });

    if (!guestUser) {
      guestUser = await prisma.user.create({
        data: {
          fullName: "Campus Guest Visitor",
          phone: "01999999999",
          email: "guest@cou.ac.bd",
          role: "VISITOR",
          isActive: true,
          isEmailVerified: true,
          visitor: {
            create: {
              purpose: "Campus Food Tasting & Dining",
            },
          },
        },
      });
    }

    const token = await signSessionToken({
      userId: guestUser.id,
      phone: guestUser.phone,
      email: guestUser.email,
      fullName: guestUser.fullName,
      role: guestUser.role,
      isEmailVerified: guestUser.isEmailVerified,
      studentId: null,
      studentVerificationStatus: null,
    });

    const response = NextResponse.redirect(new URL(callbackUrl, request.url));
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Guest login error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
