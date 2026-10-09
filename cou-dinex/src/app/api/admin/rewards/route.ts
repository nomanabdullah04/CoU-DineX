import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    const [rewards, topUsers, totalPointsAgg] = await Promise.all([
      prisma.reward.findMany({
        include: {
          user: { select: { fullName: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.reward.groupBy({
        by: ["userId"],
        _sum: { points: true },
        orderBy: { _sum: { points: "desc" } },
        take: 10,
      }),
      prisma.reward.aggregate({
        _sum: { points: true },
      }),
    ]);

    const populatedTopUsers = await Promise.all(
      topUsers.map(async (tu) => {
        const u = await prisma.user.findUnique({
          where: { id: tu.userId },
          select: { fullName: true, student: { select: { universityStudentId: true } } },
        });
        return {
          userId: tu.userId,
          name: u?.fullName || "Student",
          studentId: u?.student?.universityStudentId || "—",
          totalPoints: tu._sum.points || 0,
        };
      })
    );

    const formattedRewards = rewards.map((r) => ({
      id: r.id,
      userName: r.user.fullName,
      points: r.points,
      reason: r.reason,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      success: true,
      rewards: formattedRewards,
      topUsers: populatedTopUsers,
      totalPointsIssued: totalPointsAgg._sum.points || 0,
    });
  } catch (error) {
    console.error("Admin Rewards API error:", error);
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, user } = await requireAdminSession();
    if (error) return error;

    const body = await req.json();
    const { userId, points, reason } = body;

    if (!userId || !points || !reason) {
      return NextResponse.json({ error: "userId, points, and reason are required" }, { status: 400 });
    }

    const reward = await prisma.reward.create({
      data: {
        userId,
        points: Number(points),
        reason,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "CREATE",
        entityName: "Reward",
        entityId: reward.id,
        newValues: { userId, points, reason },
      },
    });

    return NextResponse.json({ success: true, reward });
  } catch (err: any) {
    console.error("Create reward error:", err);
    return NextResponse.json({ error: "Failed to grant reward points" }, { status: 500 });
  }
}
