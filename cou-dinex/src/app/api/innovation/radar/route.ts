import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RADAR_CONFIG } from "@/lib/innovation-config";

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch live cafeteria & table occupancy
    const [cafeteria, totalTables, occupiedTables, activeKitchenTickets, menuItems] = await Promise.all([
      prisma.cafeteria.findFirst({
        where: { isOpen: true },
      }),
      prisma.diningTable.count(),
      prisma.diningTable.count({ where: { isOccupied: true } }),
      prisma.order.count({
        where: {
          status: { in: ["CONFIRMED", "PREPARING"] },
        },
      }),
      prisma.menuItem.findMany({
        include: {
          inventory: true,
          category: true,
        },
      }),
    ]);

    // 2. Classify items into Available now and Sold out
    const availableItems = menuItems.filter(
      (m) => m.isAvailable && (!m.inventory || (!m.inventory.isSoldOut && m.inventory.currentStock > 0))
    );
    const soldOutItems = menuItems.filter(
      (m) => !m.isAvailable || (m.inventory && (m.inventory.isSoldOut || m.inventory.currentStock === 0))
    );

    // 3. Compute table occupancy & crowd level
    const availableTables = Math.max(0, totalTables - occupiedTables);
    const occupancyRatio = totalTables > 0 ? occupiedTables / totalTables : 0;

    let crowdLevel: "LOW CROWD" | "MEDIUM CROWD" | "BUSY" = "LOW CROWD";
    let crowdColor = "#16A34A"; // Emerald

    if (occupancyRatio > RADAR_CONFIG.crowdThresholds.high || activeKitchenTickets >= 10) {
      crowdLevel = "BUSY";
      crowdColor = "#DC2626"; // Crimson
    } else if (occupancyRatio >= RADAR_CONFIG.crowdThresholds.low || activeKitchenTickets >= 5) {
      crowdLevel = "MEDIUM CROWD";
      crowdColor = "#D97706"; // Amber
    }

    // 4. Compute estimated waiting time based on active kitchen queue
    const estimatedWaitMinutes = Math.round(
      RADAR_CONFIG.basePrepMinutes + activeKitchenTickets * RADAR_CONFIG.queueTimeFactorMinutes
    );

    return NextResponse.json({
      success: true,
      cafeteria: {
        name: cafeteria?.name || "CoU Central Dining Hall",
        isOpen: cafeteria?.isOpen ?? true,
        operatingHours: RADAR_CONFIG.operatingHours,
      },
      telemetry: {
        crowdLevel,
        crowdColor,
        occupancyRatio: Math.round(occupancyRatio * 100),
        totalTables,
        availableTables,
        occupiedTables,
        activeOrdersInQueue: activeKitchenTickets,
        estimatedWaitMinutes,
      },
      counts: {
        availableNow: availableItems.length,
        soldOut: soldOutItems.length,
        totalItems: menuItems.length,
      },
      availableNow: availableItems.slice(0, 12).map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        discountPrice: item.discountPrice ? Number(item.discountPrice) : null,
        category: item.category.name,
        isDailySpecial: item.isDailySpecial,
        preparationTime: item.preparationTimeMinutes,
        currentStock: item.inventory?.currentStock ?? 15,
      })),
      soldOut: soldOutItems.slice(0, 6).map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category.name,
      })),
    });
  } catch (error: any) {
    console.error("Campus Food Radar telemetry failed:", error);
    return NextResponse.json(
      { error: "Unable to load food radar telemetry" },
      { status: 500 }
    );
  }
}
