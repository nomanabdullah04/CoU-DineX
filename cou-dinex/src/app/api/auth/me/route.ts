import { NextRequest, NextResponse } from "next/server";
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
            batch: true,
            session: true,
            verificationStatus: true,
            ecoScore: true,
            rewardPoints: true,
            idCardImageUrl: true,
            department: {
              select: { name: true, code: true, faculty: true, building: true },
            },
            hall: {
              select: { name: true, code: true, type: true },
            },
          },
        },
        visitor: {
          select: { id: true, purpose: true },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
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

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, phone, avatarUrl } = body;

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(fullName && typeof fullName === "string" ? { fullName: fullName.trim() } : {}),
        ...(phone && typeof phone === "string" ? { phone: phone.trim() } : {}),
        ...(avatarUrl && typeof avatarUrl === "string" ? { avatarUrl } : {}),
      },
      select: {
        id: true,
        phone: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
