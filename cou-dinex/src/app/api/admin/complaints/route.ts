import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { ComplaintStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";

    const where: any = {};
    if (status !== "ALL" && Object.values(ComplaintStatus).includes(status as ComplaintStatus)) {
      where.status = status as ComplaintStatus;
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        user: { select: { fullName: true, phone: true } },
        order: { select: { orderNumber: true, totalAmount: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = complaints.map((c) => ({
      id: c.id,
      userName: c.user.fullName,
      orderNumber: c.order?.orderNumber || "—",
      orderAmount: c.order ? Number(c.order.totalAmount) : null,
      subject: c.subject,
      description: c.description,
      status: c.status,
      resolutionNote: c.resolutionNote,
      resolvedAt: c.resolvedAt,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({
      success: true,
      complaints: formatted,
      pendingCount: complaints.filter((c) => c.status === "PENDING").length,
    });
  } catch (error) {
    console.error("Admin Complaints API error:", error);
    return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { error, user } = await requireAdminSession();
    if (error) return error;

    const body = await req.json();
    const { complaintId, status, resolutionNote } = body;

    if (!complaintId || !status) {
      return NextResponse.json({ error: "complaintId and status are required" }, { status: 400 });
    }

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: status as ComplaintStatus,
        resolutionNote: resolutionNote || undefined,
        resolvedAt: status === "RESOLVED" ? new Date() : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "UPDATE",
        entityName: "Complaint",
        entityId: complaintId,
        newValues: { status, resolutionNote },
      },
    });

    return NextResponse.json({ success: true, complaint: updated });
  } catch (err: any) {
    console.error("Update complaint error:", err);
    return NextResponse.json({ error: "Failed to update complaint" }, { status: 500 });
  }
}
