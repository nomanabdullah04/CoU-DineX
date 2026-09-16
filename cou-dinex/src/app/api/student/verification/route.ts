import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AuditAction, StudentVerificationStatus } from "@prisma/client";

export async function GET() {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: userSession.userId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            isEmailVerified: true,
          },
        },
        department: true,
        hall: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "No student profile found" }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error("Error fetching student verification status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: userSession.userId },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ error: "No student profile found" }, { status: 404 });
    }

    // Only allow updating if currently REJECTED or MORE_INFO_REQUIRED (or PENDING)
    if (student.verificationStatus === StudentVerificationStatus.APPROVED) {
      return NextResponse.json(
        { error: "Approved students cannot modify official university verification credentials." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { universityStudentId, departmentId, session, fullName, phone } = body;

    if (!universityStudentId || !departmentId || !session) {
      return NextResponse.json(
        { error: "University Student ID, Department, and Session are required." },
        { status: 400 }
      );
    }

    // Check if new student ID is taken by another student
    if (universityStudentId !== student.universityStudentId) {
      const existing = await prisma.student.findUnique({
        where: { universityStudentId },
      });
      if (existing && existing.id !== student.id) {
        return NextResponse.json(
          { error: "This University Student ID is already registered." },
          { status: 409 }
        );
      }
    }

    const oldValues = {
      universityStudentId: student.universityStudentId,
      departmentId: student.departmentId,
      session: student.session,
      verificationStatus: student.verificationStatus,
    };

    // Update user full name and phone if provided
    if (fullName || phone) {
      await prisma.user.update({
        where: { id: student.userId },
        data: {
          ...(fullName ? { fullName } : {}),
          ...(phone ? { phone } : {}),
        },
      });
    }

    // Update student and flip status back to PENDING for review
    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        universityStudentId,
        departmentId,
        session,
        verificationStatus: StudentVerificationStatus.PENDING,
        // keep previous rejectionReason so admin can see what was previously flagged
      },
      include: {
        user: true,
        department: true,
        hall: true,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: userSession.userId,
        action: AuditAction.UPDATE,
        entityName: "Student",
        entityId: student.id,
        oldValues,
        newValues: {
          universityStudentId,
          departmentId,
          session,
          verificationStatus: StudentVerificationStatus.PENDING,
          actionTaken: "STUDENT_SUBMITTED_CORRECTIONS",
        },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent") || "Student Portal",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your information has been updated and resubmitted for university review.",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student verification info:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
