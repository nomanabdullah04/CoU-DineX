import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";
import { getItemImageUrl } from "@/lib/foodImages";

export async function GET(req: NextRequest) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    // 1. Fetch user & student profile
    const user = await prisma.user.findUnique({
      where: { id: userSession.userId },
      include: {
        student: {
          include: {
            department: true,
            hall: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    // 2. Fetch live database data for Campus Food Radar
    const [totalTables, occupiedTables, menuItems] = await Promise.all([
      prisma.diningTable.count(),
      prisma.diningTable.count({ where: { isOccupied: true } }),
      prisma.menuItem.findMany({
        where: { isAvailable: true },
        include: {
          inventory: true,
          category: true,
          cafeteria: true,
        },
        take: 8,
        orderBy: { isDailySpecial: "desc" },
      }),
    ]);

    const availableTables = Math.max(0, totalTables - occupiedTables);
    const availableFoodCount = menuItems.filter(
      (m) => m.inventory && m.inventory.currentStock > 0 && !m.inventory.isSoldOut
    ).length;

    // Crowd estimation logic based on occupied tables
    const crowdRatio = totalTables > 0 ? occupiedTables / totalTables : 0;
    const crowdLevel =
      crowdRatio < 0.4 ? "LOW CROWD" : crowdRatio < 0.75 ? "MEDIUM CROWD" : "BUSY";
    const crowdColor =
      crowdRatio < 0.4 ? "#16A34A" : crowdRatio < 0.75 ? "#D97706" : "#DC2626";

    // 3. Check for active orders
    const activeOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: {
          in: [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
            OrderStatus.READY_FOR_PICKUP,
            OrderStatus.OUT_FOR_DELIVERY,
          ],
        },
      },
      include: {
        orderItems: {
          include: { menuItem: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 4. Fetch recent orders
    const recentOrders = await prisma.order.findMany({
      where: {
        userId: user.id,
      },
      include: {
        orderItems: {
          include: { menuItem: true },
        },
      },
      take: 4,
      orderBy: { createdAt: "desc" },
    });

    // 5. Calculate Rewards & Eco points
    const rewardRecords = await prisma.reward.findMany({
      where: { userId: user.id },
    });
    const totalPoints = rewardRecords.reduce((sum, r) => sum + r.points, 420); // sample base points if empty

    // 6. Format available food items with stock status
    const foodItems = menuItems.map((item) => {
      let availabilityState: "Available" | "Few Left" | "Sold Out" = "Available";
      let dotColor = "#16A34A";

      if (!item.inventory || item.inventory.isSoldOut || item.inventory.currentStock <= 0) {
        availabilityState = "Sold Out";
        dotColor = "#DC2626";
      } else if (item.inventory.currentStock <= item.inventory.lowStockThreshold) {
        availabilityState = "Few Left";
        dotColor = "#F59E0B";
      }

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        discountPrice: item.discountPrice ? Number(item.discountPrice) : null,
        isDailySpecial: item.isDailySpecial,
        preparationTime: item.preparationTimeMinutes || 12,
        rating: 4.8,
        category: item.category.name,
        availability: availabilityState,
        dotColor,
        tags: item.tags,
        imageUrl: item.imageUrl || getItemImageUrl(item.name),
        cafeteriaId: item.cafeteriaId,
        cafeteriaName: item.cafeteria?.name || "Central Cafeteria",
      };
    });

    return NextResponse.json({
      student: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.student?.verificationStatus === "APPROVED",
        verificationStatus: user.student?.verificationStatus || "PENDING",
        studentId: user.student?.universityStudentId || "CoU Student",
        department: user.student?.department
          ? `${user.student.department.name} (${user.student.department.code})`
          : "Comilla University",
        session: user.student?.session || "2022-2023",
      },
      radar: {
        crowdLevel,
        crowdColor,
        availableTables,
        totalTables,
        availableFoodCount: availableFoodCount || foodItems.length,
        avgWaitMinutes: 11,
        cafeteriaName: "Central Cafeteria",
      },
      availableNow: foodItems,
      activeOrder: activeOrder
        ? {
          id: activeOrder.id,
          orderNumber: activeOrder.orderNumber,
          status: activeOrder.status,
          totalAmount: Number(activeOrder.totalAmount),
          deliveryType: activeOrder.deliveryType,
          estimatedTimeMinutes: 14,
          items: activeOrder.orderItems.map((i) => ({
            name: i.menuItem.name,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
          })),
          createdAt: activeOrder.createdAt,
        }
        : null,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        itemCount: o.orderItems.length,
        itemsSummary: o.orderItems.map((i) => `${i.menuItem.name} × ${i.quantity}`).join(", "),
        createdAt: o.createdAt,
      })),
      rewards: {
        points: totalPoints,
        ecoScore: 82,
        nextReward: "Free Chilled Lassi",
        pointsNeeded: Math.max(0, 500 - totalPoints),
        progressPercent: Math.min(100, Math.round((totalPoints / 500) * 100)),
      },
      offers: [
        {
          id: "offer-1",
          title: "CoU Student Discount: 15% OFF",
          description: "Applicable on all central cafeteria Lunch Set & Rice Bowls with verified student ID.",
          code: "COUSTUDENT15",
          badge: "Active Campus Offer",
        },
        {
          id: "offer-2",
          title: "Bring Your Cup / Tiffin Box",
          description: "Earn 20 Eco Points + ৳ 10 deduction on takeaway packaging waste.",
          code: "ECODINE",
          badge: "Eco Saver",
        },
      ],
      recommendation: {
        title: "Chef's Daily Special Match",
        name: "Chicken Cheese Burger + Cold Coffee",
        price: 145,
        originalPrice: 165,
        prepTime: "12 min",
        reason: "Popular among CSE students • Prepared fast • Within budget",
        rating: 4.9,
      },
    });
  } catch (error) {
    console.error("Error generating student dashboard data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
