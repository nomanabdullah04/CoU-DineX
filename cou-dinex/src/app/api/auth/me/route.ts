import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        phone: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            universityStudentId: true,
            session: true,
            verificationStatus: true,
            department: {
              select: { name: true, code: true },
            },
            hall: {
              select: { name: true, code: true },
            },
          },
        },
        visitor: {
          select: { id: true, purpose: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Failed to fetch session user" }, { status: 500 });
  }
}
