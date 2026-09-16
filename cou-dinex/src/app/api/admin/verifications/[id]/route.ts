import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  Role,
  StudentVerificationStatus,
  VerificationMethod,
  AuditAction,
  NotificationType,
} from "@prisma/client";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. Admin authentication check
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (userSession.role !== Role.SUPER_ADMIN && userSession.role !== Role.CAFETERIA_ADMIN) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    // 2. Fetch student
    const student = await prisma.student.findUnique({
      where: { id },
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
        department: true,
        hall: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }

    // 3. Fetch audit logs for this student
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityName: "Student",
        entityId: student.id,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ student, auditLogs });
  } catch (error) {
    console.error("Error fetching student details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. Admin authentication check
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (userSession.role !== Role.SUPER_ADMIN && userSession.role !== Role.CAFETERIA_ADMIN) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { action, reason } = body;

    if (!action || !["APPROVE", "REJECT", "REQUEST_MORE_INFO"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be APPROVE, REJECT, or REQUEST_MORE_INFO." },
        { status: 400 }
      );
    }

    if ((action === "REJECT" || action === "REQUEST_MORE_INFO") && (!reason || !reason.trim())) {
      return NextResponse.json(
        {
          error:
            action === "REJECT"
              ? "Rejection reason is required."
              : "Please specify what additional information is required.",
        },
        { status: 400 }
      );
    }

    // 2. Fetch student current state
    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student record not found." }, { status: 404 });
    }

    const oldValues = {
      verificationStatus: student.verificationStatus,
      rejectionReason: student.rejectionReason,
      verifiedBy: student.verifiedBy,
      verifiedAt: student.verifiedAt,
    };

    let newStatus: StudentVerificationStatus;
    let notificationTitle: string;
    let notificationMessage: string;

    const now = new Date();
    const adminIdentifier = userSession.fullName || userSession.email || "University Admin";

    if (action === "APPROVE") {
      newStatus = StudentVerificationStatus.APPROVED;
      notificationTitle = "Account Verified!";
      notificationMessage =
        "Your CoU DineX student account has been approved. You now have full access to university discounts, dining halls, and campus delivery.";
    } else if (action === "REJECT") {
      newStatus = StudentVerificationStatus.REJECTED;
      notificationTitle = "Student Verification Unsuccessful";
      notificationMessage = `Your student verification was not approved. Reason: ${reason.trim()}`;
    } else {
      newStatus = StudentVerificationStatus.MORE_INFO_REQUIRED;
      notificationTitle = "Additional Information Required";
      notificationMessage = `The administrator requested more information to verify your student account: ${reason.trim()}`;
    }

    // 3. Update student in database
    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        verificationStatus: newStatus,
        verificationMethod: VerificationMethod.ADMIN,
        verifiedBy: adminIdentifier,
        verifiedAt: now,
        rejectionReason: action === "APPROVE" ? null : reason.trim(),
      },
      include: {
        user: true,
        department: true,
        hall: true,
      },
    });

    // If approved, ensure user.isActive is true
    if (action === "APPROVE") {
      await prisma.user.update({
        where: { id: student.userId },
        data: { isActive: true },
      });
    }

    const newValues = {
      verificationStatus: newStatus,
      rejectionReason: action === "APPROVE" ? null : reason.trim(),
      verifiedBy: adminIdentifier,
      verifiedAt: now,
      verificationMethod: VerificationMethod.ADMIN,
    };

    // 4. Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: userSession.userId,
        action: AuditAction.VERIFY,
        entityName: "Student",
        entityId: student.id,
        oldValues,
        newValues,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1",
        userAgent: req.headers.get("user-agent") || "Admin Portal",
      },
    });

    // 5. Send in-app Notification to student
    await prisma.notification.create({
      data: {
        userId: student.userId,
        type: NotificationType.VERIFICATION,
        title: notificationTitle,
        body: notificationMessage,
        actionUrl: "/student/verification-status",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Student successfully marked as ${newStatus}`,
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student verification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
