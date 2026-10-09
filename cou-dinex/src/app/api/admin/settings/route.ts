import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    const cafeterias = await prisma.cafeteria.findMany({
      include: {
        _count: {
          select: { menuItems: true, menuCategories: true, orders: true, tables: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        campusName: "Comilla University (CoU)",
        platformVersion: "v1.4.0 (Phase 14 Production)",
        currencySymbol: "৳",
        standardDeliveryFee: 20,
        cafeterias: cafeterias.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          location: c.location,
          isOpen: c.isOpen,
          openingTime: c.openingTime || "08:00 AM",
          closingTime: c.closingTime || "09:00 PM",
          stats: c._count,
        })),
        features: {
          foodRadarEnabled: true,
          smartQueueEnabled: true,
          groupOrderingEnabled: true,
          campusDeliveryEnabled: true,
          secureOtpHandover: true,
        },
      },
    });
  } catch (error) {
    console.error("Admin Settings API error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { error, user } = await requireAdminSession();
    if (error) return error;

    const body = await req.json();
    const { cafeteriaId, isOpen, openingTime, closingTime, location } = body;

    if (!cafeteriaId) {
      return NextResponse.json({ error: "cafeteriaId is required" }, { status: 400 });
    }

    const updated = await prisma.cafeteria.update({
      where: { id: cafeteriaId },
      data: {
        isOpen: isOpen !== undefined ? Boolean(isOpen) : undefined,
        openingTime: openingTime || undefined,
        closingTime: closingTime || undefined,
        location: location || undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "UPDATE",
        entityName: "CafeteriaSettings",
        entityId: cafeteriaId,
        newValues: { isOpen, openingTime, closingTime, location },
      },
    });

    return NextResponse.json({ success: true, cafeteria: updated });
  } catch (err: any) {
    console.error("Update settings error:", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
