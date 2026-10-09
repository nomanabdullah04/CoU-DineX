import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const cafeteriaId = searchParams.get("cafeteriaId");

    const where: any = {};
    if (cafeteriaId) where.cafeteriaId = cafeteriaId;

    const categories = await prisma.menuCategory.findMany({
      where,
      include: {
        cafeteria: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        displayOrder: c.displayOrder,
        isActive: c.isActive,
        cafeteriaId: c.cafeteriaId,
        cafeteriaName: c.cafeteria.name,
        itemCount: c._count.items,
      })),
    });
  } catch (error) {
    console.error("Admin Categories API error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, user } = await requireAdminSession();
    if (error) return error;

    const body = await req.json();
    const { name, slug, cafeteriaId, displayOrder } = body;

    if (!name || !cafeteriaId) {
      return NextResponse.json({ error: "Category name and cafeteriaId are required" }, { status: 400 });
    }

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const category = await prisma.menuCategory.create({
      data: {
        name,
        slug: generatedSlug,
        cafeteriaId,
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "CREATE",
        entityName: "MenuCategory",
        entityId: category.id,
        newValues: { name, slug: generatedSlug, cafeteriaId },
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (err: any) {
    console.error("Create category error:", err);
    return NextResponse.json({ error: err.message || "Failed to create category" }, { status: 500 });
  }
}
