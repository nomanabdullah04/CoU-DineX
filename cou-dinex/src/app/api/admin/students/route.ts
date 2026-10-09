import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession, maskPhone, maskEmail } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "ALL"; // PENDING, APPROVED, REJECTED, MORE_INFO_REQUIRED
    const deptId = searchParams.get("dept") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (status !== "ALL") {
      where.verificationStatus = status;
    }
    if (deptId) {
      where.departmentId = deptId;
    }
    if (search) {
      where.OR = [
        { universityStudentId: { contains: search, mode: "insensitive" } },
        { user: { fullName: { contains: search, mode: "insensitive" } } },
        { user: { phone: { contains: search } } },
      ];
    }

    const [students, total, departments] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatarUrl: true,
              role: true,
              isActive: true,
              createdAt: true,
            },
          },
          department: { select: { id: true, name: true, code: true } },
          hall: { select: { id: true, name: true, code: true } },
          _count: { select: { classSchedules: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.student.count({ where }),
      prisma.department.findMany({ select: { id: true, name: true, code: true }, orderBy: { name: "asc" } }),
    ]);

    // Privacy protected output
    const sanitizedStudents = students.map((s) => ({
      id: s.id,
      studentId: s.universityStudentId,
      session: s.session,
      batch: s.batch,
      verificationStatus: s.verificationStatus,
      verificationMethod: s.verificationMethod,
      verifiedAt: s.verifiedAt,
      verifiedBy: s.verifiedBy,
      rejectionReason: s.rejectionReason,
      department: s.department,
      hall: s.hall,
      user: {
        id: s.user.id,
        fullName: s.user.fullName,
        maskedPhone: maskPhone(s.user.phone),
        maskedEmail: maskEmail(s.user.email),
        avatarUrl: s.user.avatarUrl,
        isActive: s.user.isActive,
        createdAt: s.user.createdAt,
      },
      classScheduleCount: s._count.classSchedules,
    }));

    return NextResponse.json({
      success: true,
      students: sanitizedStudents,
      departments,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin Students API error:", error);
    return NextResponse.json({ error: "Failed to fetch student records" }, { status: 500 });
  }
}
