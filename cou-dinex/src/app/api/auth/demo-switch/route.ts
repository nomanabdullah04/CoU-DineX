import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();

    let targetEmail = "noman.pending@cou.ac.bd"; // Default student

    if (role === "kitchen" || role === "CAFETERIA_STAFF") {
      targetEmail = "kitchen@cou.ac.bd";
    } else if (role === "delivery" || role === "DELIVERY_AGENT") {
      targetEmail = "delivery@cou.ac.bd";
    } else if (role === "admin" || role === "SUPER_ADMIN") {
      targetEmail = "admin@cou.ac.bd";
    } else if (role === "visitor" || role === "VISITOR") {
      targetEmail = "abdullahcse.cou14@gmail.com";
    } else {
      targetEmail = "noman.pending@cou.ac.bd";
    }

    let user = await prisma.user.findFirst({
      where: { email: targetEmail },
      include: {
        student: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: `User with email ${targetEmail} not found` }, { status: 404 });
    }

    const token = await signSessionToken({
      userId: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      studentId: user.student?.universityStudentId || null,
      studentVerificationStatus: user.student?.verificationStatus || null,
    });

    let destination = "/home";
    if (user.role === "CAFETERIA_STAFF") destination = "/kitchen";
    else if (user.role === "DELIVERY_AGENT") destination = "/delivery";
    else if (user.role === "SUPER_ADMIN" || user.role === "CAFETERIA_ADMIN") destination = "/admin";

    const response = NextResponse.json({
      success: true,
      destination,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Demo switch error:", error);
    return NextResponse.json({ error: error?.message || "Failed to switch role" }, { status: 500 });
  }
}
