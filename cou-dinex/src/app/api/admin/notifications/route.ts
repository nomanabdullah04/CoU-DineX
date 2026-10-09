import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { sendNotification } from "@/lib/notifications/notification-service";
import { NotificationType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    const notifications = await prisma.notification.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, role: true } },
      },
    });

    const formatted = notifications.map((n) => ({
      id: n.id,
      recipientName: n.user.fullName,
      recipientRole: n.user.role,
      title: n.title,
      body: n.body,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));

    return NextResponse.json({ success: true, notifications: formatted });
  } catch (error) {
    console.error("Admin Notifications API error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, user } = await requireAdminSession();
    if (error) return error;

    const body = await req.json();
    const { targetGroup, title, message } = body; // ALL, STUDENTS, STAFF

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    let targetUsers: { id: string }[] = [];
    if (targetGroup === "STUDENTS") {
      targetUsers = await prisma.user.findMany({ where: { role: "STUDENT", isActive: true }, select: { id: true } });
    } else if (targetGroup === "STAFF") {
      targetUsers = await prisma.user.findMany({
        where: { role: { in: ["CAFETERIA_STAFF", "CAFETERIA_ADMIN", "DELIVERY_AGENT"] }, isActive: true },
        select: { id: true },
      });
    } else {
      // Broadcast ALL
      targetUsers = await prisma.user.findMany({ where: { isActive: true }, select: { id: true }, take: 200 });
    }

    // Broadcast in parallel batch
    await Promise.all(
      targetUsers.map((u) =>
        sendNotification({
          userId: u.id,
          type: NotificationType.SYSTEM_NOTIFICATION,
          title,
          body: message,
        })
      )
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "CREATE",
        entityName: "BroadcastNotification",
        newValues: { targetGroup, title, recipientCount: targetUsers.length },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Broadcast successfully sent to ${targetUsers.length} users.`,
    });
  } catch (err: any) {
    console.error("Broadcast notification error:", err);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
