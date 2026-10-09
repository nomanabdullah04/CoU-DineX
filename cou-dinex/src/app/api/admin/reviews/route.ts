import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const minRating = searchParams.get("rating");

    const where: any = {};
    if (minRating) {
      where.rating = parseInt(minRating);
    }
    if (search) {
      where.OR = [
        { comment: { contains: search, mode: "insensitive" } },
        { menuItem: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [reviews, total, avgRatingAgg] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { fullName: true } },
          menuItem: { select: { name: true, price: true } },
          order: { select: { orderNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        _avg: { rating: true },
      }),
    ]);

    const formatted = reviews.map((r) => ({
      id: r.id,
      customerName: r.user.fullName,
      itemName: r.menuItem?.name || "Order Item",
      orderNumber: r.order?.orderNumber || "—",
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      success: true,
      reviews: formatted,
      totalReviews: total,
      averageRating: avgRatingAgg._avg.rating ? Number(avgRatingAgg._avg.rating.toFixed(1)) : 5.0,
    });
  } catch (error) {
    console.error("Admin Reviews API error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
