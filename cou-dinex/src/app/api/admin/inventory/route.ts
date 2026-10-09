import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const filter = searchParams.get("filter") || "ALL"; // ALL, LOW_STOCK, SOLD_OUT

    const where: any = {};
    if (search) {
      where.menuItem = {
        name: { contains: search, mode: "insensitive" },
      };
    }
    if (filter === "LOW_STOCK") {
      where.currentStock = { lte: 5, gt: 0 };
    } else if (filter === "SOLD_OUT") {
      where.OR = [{ isSoldOut: true }, { currentStock: 0 }];
    }

    const inventoryItems = await prisma.inventory.findMany({
      where,
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            isAvailable: true,
            category: { select: { name: true } },
          },
        },
        cafeteria: { select: { id: true, name: true } },
      },
      orderBy: { currentStock: "asc" },
    });

    const items = inventoryItems.map((inv) => ({
      id: inv.id,
      menuItemId: inv.menuItemId,
      name: inv.menuItem.name,
      category: inv.menuItem.category.name,
      price: Number(inv.menuItem.price),
      imageUrl: inv.menuItem.imageUrl,
      isAvailable: inv.menuItem.isAvailable,
      cafeteriaName: inv.cafeteria.name,
      currentStock: inv.currentStock,
      dailyStartingStock: inv.dailyStartingStock,
      lowStockThreshold: inv.lowStockThreshold,
      isSoldOut: inv.isSoldOut || inv.currentStock === 0,
      updatedAt: inv.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      items,
      lowStockCount: inventoryItems.filter((i) => i.currentStock <= i.lowStockThreshold && i.currentStock > 0).length,
      soldOutCount: inventoryItems.filter((i) => i.isSoldOut || i.currentStock === 0).length,
    });
  } catch (error) {
    console.error("Admin Inventory API error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { error, user } = await requireAdminSession();
    if (error) return error;

    const body = await req.json();
    const { inventoryId, currentStock, lowStockThreshold, isSoldOut } = body;

    if (!inventoryId) {
      return NextResponse.json({ error: "inventoryId is required" }, { status: 400 });
    }

    const updated = await prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        currentStock: currentStock !== undefined ? Number(currentStock) : undefined,
        lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : undefined,
        isSoldOut: isSoldOut !== undefined ? Boolean(isSoldOut) : (currentStock !== undefined ? Number(currentStock) <= 0 : undefined),
      },
      include: { menuItem: true },
    });

    // Also sync menuItem.isAvailable if sold out
    if (isSoldOut || (currentStock !== undefined && Number(currentStock) <= 0)) {
      await prisma.menuItem.update({
        where: { id: updated.menuItemId },
        data: { isAvailable: false },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "UPDATE",
        entityName: "Inventory",
        entityId: inventoryId,
        newValues: { currentStock, isSoldOut },
      },
    });

    return NextResponse.json({ success: true, inventory: updated });
  } catch (err: any) {
    console.error("Update inventory error:", err);
    return NextResponse.json({ error: "Failed to update inventory stock" }, { status: 500 });
  }
}
