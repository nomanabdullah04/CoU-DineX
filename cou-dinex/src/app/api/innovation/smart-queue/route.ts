import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SMART_QUEUE_CONFIG, RADAR_CONFIG } from "@/lib/innovation-config";

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch live queue metrics from DB
    const [pendingOrders, preparingOrders, avgPrepAgg] = await Promise.all([
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "PREPARING" } }),
      prisma.menuItem.aggregate({
        _avg: { preparationTimeMinutes: true },
      }),
    ]);

    const totalActiveQueue = pendingOrders + preparingOrders;
    const basePrepTime = Math.round(avgPrepAgg._avg.preparationTimeMinutes || RADAR_CONFIG.basePrepMinutes);

    // Dynamic queue estimation
    const estimatedPrepMinutes = Math.round(
      basePrepTime + totalActiveQueue * RADAR_CONFIG.queueTimeFactorMinutes
    );

    // 2. Check current time against configured rush periods
    const now = new Date();
    const currentHourDecimal = now.getHours() + now.getMinutes() / 60;

    let activeRush = SMART_QUEUE_CONFIG.rushHours.find(
      (r) => currentHourDecimal >= r.startHour && currentHourDecimal <= r.endHour
    );

    let upcomingRush = SMART_QUEUE_CONFIG.rushHours.find(
      (r) => r.startHour > currentHourDecimal
    );

    let suggestedOrderTime = "Order now for minimum wait (~" + estimatedPrepMinutes + " min)";
    let queueStatus: "SMOOTH" | "MODERATE" | "HIGH_RUSH" = "SMOOTH";

    if (activeRush) {
      queueStatus = activeRush.rushLevel === "PEAK" ? "HIGH_RUSH" : "MODERATE";
      suggestedOrderTime = `Currently in ${activeRush.name}. Place order now to secure your queue spot.`;
    } else if (upcomingRush && upcomingRush.startHour - currentHourDecimal < 0.75) {
      // Rush starts in less than 45 minutes
      const minsUntilRush = Math.round((upcomingRush.startHour - currentHourDecimal) * 60);
      suggestedOrderTime = `Rush begins in ~${minsUntilRush}m (${upcomingRush.name}). Order before to avoid 20+ min queue!`;
    }

    return NextResponse.json({
      success: true,
      currentQueue: {
        totalOrders: totalActiveQueue,
        pendingApproval: pendingOrders,
        currentlyCooking: preparingOrders,
        queueStatus,
      },
      estimation: {
        basePreparationMinutes: basePrepTime,
        estimatedPreparationMinutes: estimatedPrepMinutes,
        suggestedOrderTime,
      },
      rushSchedule: {
        activeRushPeriod: activeRush?.name || null,
        upcomingRushPeriod: upcomingRush?.name || null,
        rushScheduleList: SMART_QUEUE_CONFIG.rushHours,
      },
    });
  } catch (error: any) {
    console.error("Smart Queue estimation failed:", error);
    return NextResponse.json(
      { error: "Unable to calculate smart queue metrics" },
      { status: 500 }
    );
  }
}
