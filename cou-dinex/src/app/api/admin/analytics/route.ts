import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d"; // 7d, 30d, 90d, 1y, all
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let startDate = new Date();
    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
    } else if (range === "7d") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === "90d") {
      startDate.setDate(startDate.getDate() - 90);
    } else if (range === "1y") {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      // 30d default
      startDate.setDate(startDate.getDate() - 30);
    }

    const endDate = endDateParam ? new Date(endDateParam) : new Date();

    // Aggregated Stats
    const [
      totalOrders,
      totalDeliveredOrders,
      totalCancelledOrders,
      revenueResult,
      totalUsers,
      totalStudents,
      activeMenuCount,
      lowStockInventoryCount,
      pendingComplaintsCount,
      pendingVerificationsCount,
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      prisma.order.count({ where: { status: "DELIVERED", createdAt: { gte: startDate, lte: endDate } } }),
      prisma.order.count({ where: { status: "CANCELLED", createdAt: { gte: startDate, lte: endDate } } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: "DELIVERED", createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.user.count(),
      prisma.student.count(),
      prisma.menuItem.count({ where: { isAvailable: true } }),
      prisma.inventory.count({ where: { currentStock: { lte: 5 } } }),
      prisma.complaint.count({ where: { status: "PENDING" } }),
      prisma.student.count({ where: { verificationStatus: "PENDING" } }),
    ]);

    // Daily Orders & Revenue time series (last 14 days or filtered period)
    const ordersInPeriod = await prisma.order.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: {
        createdAt: true,
        status: true,
        totalAmount: true,
        deliveryType: true,
        user: { select: { role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Bucket into dates
    const dailyMap: Record<string, { date: string; orders: number; delivered: number; cancelled: number; revenue: number; studentOrders: number; visitorOrders: number }> = {};
    const hourMap: Record<number, number> = {};

    for (let h = 0; h < 24; h++) hourMap[h] = 0;

    ordersInPeriod.forEach((o) => {
      const d = o.createdAt.toISOString().slice(0, 10);
      if (!dailyMap[d]) {
        dailyMap[d] = { date: d, orders: 0, delivered: 0, cancelled: 0, revenue: 0, studentOrders: 0, visitorOrders: 0 };
      }
      dailyMap[d].orders += 1;
      if (o.status === "DELIVERED") {
        dailyMap[d].delivered += 1;
        dailyMap[d].revenue += Number(o.totalAmount);
      }
      if (o.status === "CANCELLED") {
        dailyMap[d].cancelled += 1;
      }
      if (o.user?.role === "STUDENT") {
        dailyMap[d].studentOrders += 1;
      } else {
        dailyMap[d].visitorOrders += 1;
      }

      const hour = new Date(o.createdAt).getHours();
      hourMap[hour] = (hourMap[hour] || 0) + 1;
    });

    const timeSeries = Object.values(dailyMap);

    // Peak ordering hours
    const peakHours = Object.entries(hourMap).map(([hour, count]) => ({
      hour: parseInt(hour),
      formattedHour: `${parseInt(hour) % 12 || 12} ${parseInt(hour) >= 12 ? "PM" : "AM"}`,
      count,
    }));

    // Top Popular Foods from database
    const topItems = await prisma.orderItem.groupBy({
      by: ["menuItemId"],
      _sum: { quantity: true, totalPrice: true },
      _count: { id: true },
      where: { order: { status: "DELIVERED" } },
      orderBy: { _sum: { quantity: "desc" } },
      take: 6,
    });

    const populatedTopItems = await Promise.all(
      topItems.map(async (ti) => {
        const item = await prisma.menuItem.findUnique({
          where: { id: ti.menuItemId },
          select: { name: true, price: true, category: { select: { name: true } } },
        });
        return {
          menuItemId: ti.menuItemId,
          name: item?.name || "Unknown item",
          category: item?.category?.name || "General",
          quantitySold: ti._sum.quantity || 0,
          totalRevenue: Number(ti._sum.totalPrice || 0),
        };
      })
    );

    // Delivery Type Distribution
    const deliveryTypeStats = await prisma.order.groupBy({
      by: ["deliveryType"],
      _count: { id: true },
      where: { createdAt: { gte: startDate, lte: endDate } },
    });

    // Kitchen & Delivery Performance metrics
    const deliveredWithTracking = await prisma.order.findMany({
      where: {
        status: "DELIVERED",
        deliveryTracking: { isNot: null },
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        updatedAt: true,
        deliveryTracking: {
          select: {
            pickupTime: true,
            actualDeliveryTime: true,
          },
        },
      },
      take: 50,
    });

    let avgKitchenTimeMinutes = 18;
    let avgDeliveryTimeMinutes = 14;

    if (deliveredWithTracking.length > 0) {
      let totalKitchenTime = 0;
      let totalDeliveryTime = 0;
      let countKitchen = 0;
      let countDelivery = 0;

      deliveredWithTracking.forEach((item) => {
        if (item.deliveryTracking?.pickupTime) {
          const kitchenDiff = (new Date(item.deliveryTracking.pickupTime).getTime() - new Date(item.createdAt).getTime()) / 60000;
          if (kitchenDiff > 0 && kitchenDiff < 180) {
            totalKitchenTime += kitchenDiff;
            countKitchen++;
          }
        }
        if (item.deliveryTracking?.pickupTime && item.deliveryTracking?.actualDeliveryTime) {
          const delivDiff = (new Date(item.deliveryTracking.actualDeliveryTime).getTime() - new Date(item.deliveryTracking.pickupTime).getTime()) / 60000;
          if (delivDiff > 0 && delivDiff < 120) {
            totalDeliveryTime += delivDiff;
            countDelivery++;
          }
        }
      });

      if (countKitchen > 0) avgKitchenTimeMinutes = Math.round(totalKitchenTime / countKitchen);
      if (countDelivery > 0) avgDeliveryTimeMinutes = Math.round(totalDeliveryTime / countDelivery);
    }

    return NextResponse.json({
      success: true,
      period: { range, startDate, endDate },
      summary: {
        totalOrders,
        totalDeliveredOrders,
        totalCancelledOrders,
        totalRevenue: Number(revenueResult._sum.totalAmount || 0),
        cancellationRate: totalOrders > 0 ? Number(((totalCancelledOrders / totalOrders) * 100).toFixed(1)) : 0,
        totalUsers,
        totalStudents,
        activeMenuCount,
        lowStockInventoryCount,
        pendingComplaintsCount,
        pendingVerificationsCount,
        avgKitchenTimeMinutes,
        avgDeliveryTimeMinutes,
      },
      timeSeries,
      peakHours,
      popularFoods: populatedTopItems,
      deliveryTypes: deliveryTypeStats.map((dt) => ({ type: dt.deliveryType, count: dt._count.id })),
    });
  } catch (error: any) {
    console.error("Admin Analytics API error:", error);
    return NextResponse.json({ error: "Failed to generate analytics" }, { status: 500 });
  }
}
