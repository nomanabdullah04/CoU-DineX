import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "ALL"; // ALL, FAILED_LOGINS, ADMIN_ACTIONS, SUSPICIOUS

    const where: any = {};
    if (filter === "FAILED_LOGINS") {
      where.action = "LOGIN";
      where.newValues = { path: ["status"], string_contains: "FAILED" };
    } else if (filter === "ADMIN_ACTIONS") {
      where.action = { in: ["CREATE", "UPDATE", "DELETE", "VERIFY"] };
    }

    const [auditLogs, totalLogs, failedLoginsCount, recentAdminActions] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { fullName: true, role: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: {
          action: "LOGIN",
          entityId: "FAILED_USER_NOT_FOUND",
        },
      }),
      prisma.auditLog.findMany({
        where: {
          action: { in: ["CREATE", "UPDATE", "DELETE", "VERIFY"] },
        },
        include: { user: { select: { fullName: true, role: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    // Detect suspicious activity: e.g. same IP with > 3 failed attempts in last 24h
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);

    const failedLogins24h = await prisma.auditLog.findMany({
      where: {
        action: "LOGIN",
        createdAt: { gte: dayAgo },
      },
      select: { ipAddress: true, newValues: true, createdAt: true },
    });

    const ipFailureCount: Record<string, number> = {};
    failedLogins24h.forEach((log) => {
      const isFailed = JSON.stringify(log.newValues || {}).includes("FAILED");
      if (isFailed && log.ipAddress) {
        ipFailureCount[log.ipAddress] = (ipFailureCount[log.ipAddress] || 0) + 1;
      }
    });

    const suspiciousIps = Object.entries(ipFailureCount)
      .filter(([_, count]) => count >= 3)
      .map(([ip, count]) => ({
        ipAddress: ip,
        failedAttempts: count,
        threatLevel: count > 10 ? "HIGH" : "MEDIUM",
        reason: `${count} failed authentication attempts in the past 24 hours`,
      }));

    const formattedLogs = auditLogs.map((l) => ({
      id: l.id,
      action: l.action,
      entityName: l.entityName,
      entityId: l.entityId,
      actorName: l.user?.fullName || "System / Guest",
      actorRole: l.user?.role || "GUEST",
      ipAddress: l.ipAddress || "127.0.0.1",
      userAgent: l.userAgent || "Browser",
      details: l.newValues,
      createdAt: l.createdAt,
    }));

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      summary: {
        totalAuditLogs: totalLogs,
        failedLoginsCount,
        suspiciousIndicatorsCount: suspiciousIps.length,
        systemHealth: suspiciousIps.length > 0 ? "ATTENTION_REQUIRED" : "SECURE",
      },
      suspiciousIndicators: suspiciousIps,
      recentAdminActions: recentAdminActions.map((ra) => ({
        id: ra.id,
        adminName: ra.user?.fullName || "System Admin",
        role: ra.user?.role || "SUPER_ADMIN",
        action: ra.action,
        entityName: ra.entityName,
        createdAt: ra.createdAt,
      })),
    });
  } catch (error) {
    console.error("Admin Security API error:", error);
    return NextResponse.json({ error: "Failed to fetch security logs" }, { status: 500 });
  }
}
