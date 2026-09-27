import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ECO_SCORE_CONFIG } from "@/lib/innovation-config";

export async function GET(req: NextRequest) {
  try {
    const userSession = await getCurrentUser();

    let studentEcoScore = 48; // Baseline campus score
    let completedOrdersCount = 0;

    if (userSession) {
      const student = await prisma.student.findUnique({
        where: { userId: userSession.userId },
      });
      if (student) {
        studentEcoScore = student.ecoScore || 48;
      }

      completedOrdersCount = await prisma.order.count({
        where: { userId: userSession.userId, status: "DELIVERED" },
      });
    }

    // Dynamic eco score with orders (capped at 100)
    const currentScore = Math.min(100, studentEcoScore + Math.min(30, completedOrdersCount * 3));

    // Determine current badge
    const earnedBadge = [...ECO_SCORE_CONFIG.badges]
      .reverse()
      .find((b) => currentScore >= b.score) || ECO_SCORE_CONFIG.badges[0];

    // Estimated sustainable habits metrics
    const avoidedPlastics = completedOrdersCount * 2 + 8;
    const reusablePlateOrders = completedOrdersCount + 4;

    return NextResponse.json({
      success: true,
      ecoScore: currentScore,
      maxScore: 100,
      disclaimer: ECO_SCORE_CONFIG.disclaimer,
      earnedBadge,
      allBadges: ECO_SCORE_CONFIG.badges,
      metrics: {
        avoidedSingleUsePlastics: avoidedPlastics,
        reusableDineInMeals: reusablePlateOrders,
        campusWalkingDeliveries: Math.max(1, Math.round(completedOrdersCount * 0.7)),
      },
      scoringRules: ECO_SCORE_CONFIG.scoringRules,
    });
  } catch (error: any) {
    console.error("Fetch eco score failed:", error);
    return NextResponse.json({ error: "Failed to calculate eco score" }, { status: 500 });
  }
}
