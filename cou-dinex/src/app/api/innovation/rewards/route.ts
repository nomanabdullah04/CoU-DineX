import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { REWARDS_CONFIG } from "@/lib/innovation-config";

export async function GET(req: NextRequest) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user with student record, rewards, and completed orders
    const [user, completedOrders, rewardLogs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userSession.userId },
        include: { student: true },
      }),
      prisma.order.findMany({
        where: { userId: userSession.userId, status: "DELIVERED" },
        select: { id: true, totalAmount: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.reward.findMany({
        where: { userId: userSession.userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate total earned points:
    // Base: 1 point per 10 BDT spent on completed orders
    const spentAmount = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const orderPoints = Math.floor(spentAmount / REWARDS_CONFIG.takaPerPoint);
    const logPoints = rewardLogs.reduce((sum, r) => sum + r.points, 0);

    // Initial bonus for student account
    const totalPoints = (user.student?.rewardPoints || 0) + orderPoints + logPoints + 50;

    // Determine Tier
    let currentTier = REWARDS_CONFIG.tiers[0];
    let nextTier = REWARDS_CONFIG.tiers[1];

    for (let i = 0; i < REWARDS_CONFIG.tiers.length; i++) {
      const tier = REWARDS_CONFIG.tiers[i];
      if (totalPoints >= tier.minPoints && totalPoints <= tier.maxPoints) {
        currentTier = tier;
        nextTier = REWARDS_CONFIG.tiers[i + 1] || null;
        break;
      }
    }

    const pointsNeeded = nextTier ? Math.max(0, nextTier.minPoints - totalPoints) : 0;
    const tierRange = nextTier ? nextTier.minPoints - currentTier.minPoints : 100;
    const progressPercent = nextTier
      ? Math.min(100, Math.round(((totalPoints - currentTier.minPoints) / tierRange) * 100))
      : 100;

    return NextResponse.json({
      success: true,
      points: totalPoints,
      currentTier,
      nextTier,
      progress: {
        pointsNeeded,
        progressPercent,
      },
      completedOrdersCount: completedOrders.length,
      milestones: [
        {
          title: "First Order Welcome",
          points: REWARDS_CONFIG.milestones.firstOrder,
          achieved: completedOrders.length >= 1,
        },
        {
          title: "5th Order Loyalty Bonus",
          points: REWARDS_CONFIG.milestones.fifthOrder,
          achieved: completedOrders.length >= 5,
        },
        {
          title: "10th Order Dining VIP",
          points: REWARDS_CONFIG.milestones.tenthOrder,
          achieved: completedOrders.length >= 10,
        },
      ],
      redeemableRewards: REWARDS_CONFIG.redeemableRewards.map((r) => ({
        ...r,
        canRedeem: totalPoints >= r.pointsCost,
      })),
      recentLogs: rewardLogs.slice(0, 5),
    });
  } catch (error: any) {
    console.error("Fetch rewards failed:", error);
    return NextResponse.json({ error: "Failed to load rewards" }, { status: 500 });
  }
}

// Redeem Reward
export async function POST(req: NextRequest) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rewardId } = body;

    const rewardConfig = REWARDS_CONFIG.redeemableRewards.find((r) => r.id === rewardId);
    if (!rewardConfig) {
      return NextResponse.json({ error: "Invalid reward item selected" }, { status: 400 });
    }

    // Record reward redemption
    const redeemed = await prisma.reward.create({
      data: {
        userId: userSession.userId,
        points: -rewardConfig.pointsCost,
        reason: `Redeemed voucher: ${rewardConfig.title}`,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days valid
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully redeemed ${rewardConfig.title}! Voucher saved to your profile.`,
      reward: redeemed,
    });
  } catch (error: any) {
    console.error("Redeem reward failed:", error);
    return NextResponse.json({ error: "Failed to redeem reward" }, { status: 500 });
  }
}
