import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role, StudentVerificationStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify Admin authentication
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    if (userSession.role !== Role.SUPER_ADMIN && userSession.role !== Role.CAFETERIA_ADMIN) {
      return NextResponse.json(
        { error: "Forbidden. Only administrators can access student verification data." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search")?.trim() || "";

    // 2. Build where filter
    const where: Record<string, any> = {};

    if (statusFilter && statusFilter !== "ALL") {
      if (Object.values(StudentVerificationStatus).includes(statusFilter as StudentVerificationStatus)) {
        where.verificationStatus = statusFilter as StudentVerificationStatus;
      }
    }

    if (search) {
      where.OR = [
        { universityStudentId: { contains: search, mode: "insensitive" } },
        { user: { fullName: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { phone: { contains: search, mode: "insensitive" } } },
        { department: { name: { contains: search, mode: "insensitive" } } },
        { department: { code: { contains: search, mode: "insensitive" } } },
      ];
    }

    // 3. Query students
    const students = await prisma.student.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            isEmailVerified: true,
            isActive: true,
            createdAt: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        hall: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 4. Calculate status counts for dashboard tabs
    const [allCount, pendingCount, approvedCount, rejectedCount, moreInfoCount] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { verificationStatus: StudentVerificationStatus.PENDING } }),
      prisma.student.count({ where: { verificationStatus: StudentVerificationStatus.APPROVED } }),
      prisma.student.count({ where: { verificationStatus: StudentVerificationStatus.REJECTED } }),
      prisma.student.count({ where: { verificationStatus: StudentVerificationStatus.MORE_INFO_REQUIRED } }),
    ]);

    return NextResponse.json({
      students,
      counts: {
        all: allCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        moreInfo: moreInfoCount,
      },
    });
  } catch (error) {
    console.error("Error fetching verification students:", error);
    return NextResponse.json(
      { error: "Internal server error fetching verifications" },
      { status: 500 }
    );
  }
}
