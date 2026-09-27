import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userSession = await getCurrentUser();

    // Fetch user order history to calculate favorite categories if logged in
    let favoriteCategoryNames: string[] = [];
    if (userSession) {
      const pastOrders = await prisma.order.findMany({
        where: { userId: userSession.userId },
        include: {
          orderItems: {
            include: { menuItem: { include: { category: true } } },
          },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      });

      const catCounts: Record<string, number> = {};
      pastOrders.forEach((o) => {
        o.orderItems.forEach((it) => {
          const cat = it.menuItem.category.name;
          catCounts[cat] = (catCounts[cat] || 0) + it.quantity;
        });
      });

      favoriteCategoryNames = Object.entries(catCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name);
    }

    // Time of day recommendation
    const hour = new Date().getHours();
    let mealContext = "Lunch & Meals";
    if (hour < 11) mealContext = "Breakfast & Quick Start";
    else if (hour >= 15 && hour < 19) mealContext = "Evening Snacks & Refreshment";
    else if (hour >= 19) mealContext = "Dinner & Hall Meal";

    // Fetch available menu items
    const availableItems = await prisma.menuItem.findMany({
      where: { isAvailable: true },
      include: { category: true },
      take: 8,
      orderBy: [{ isDailySpecial: "desc" }, { createdAt: "desc" }],
    });

    const recommendations = availableItems.map((item, idx) => {
      let reason = "Popular campus staple";
      if (item.isDailySpecial) reason = "Today's Chef Daily Special";
      else if (favoriteCategoryNames.includes(item.category.name)) {
        reason = `Matches your taste for ${item.category.name}`;
      } else if (Number(item.price) <= 100) {
        reason = "Student wallet budget friendly";
      } else if (item.preparationTimeMinutes <= 12) {
        reason = "Fast prep (~" + item.preparationTimeMinutes + " min)";
      }

      return {
        id: item.id,
        name: item.name,
        price: Number(item.price),
        discountPrice: item.discountPrice ? Number(item.discountPrice) : null,
        category: item.category.name,
        preparationTime: item.preparationTimeMinutes,
        imageUrl: item.imageUrl,
        reason,
        mealContext,
      };
    });

    return NextResponse.json({
      success: true,
      mealContext,
      recommendations,
    });
  } catch (error: any) {
    console.error("Fetch recommendations failed:", error);
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
