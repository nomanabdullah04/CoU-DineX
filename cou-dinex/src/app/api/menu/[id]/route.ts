import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        cafeteria: true,
        inventory: true,
        reviews: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const ratings = item.reviews.map((r) => r.rating);
    const avgRating = ratings.length > 0
      ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
      : null;
    const isSoldOut = !item.isAvailable || (item.inventory?.isSoldOut ?? false);

    return NextResponse.json({
      id: item.id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price.toString()),
      discountPrice: item.discountPrice ? parseFloat(item.discountPrice.toString()) : null,
      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
      isSoldOut,
      isDailySpecial: item.isDailySpecial,
      preparationTimeMinutes: item.preparationTimeMinutes,
      tags: item.tags,
      category: item.category,
      cafeteria: item.cafeteria,
      inventory: item.inventory ? {
        currentStock: item.inventory.currentStock,
        isSoldOut: item.inventory.isSoldOut,
        lowStockThreshold: item.inventory.lowStockThreshold,
      } : null,
      avgRating,
      reviewCount: item.reviews.length,
      reviews: item.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: r.user,
      })),
    });
  } catch (error) {
    console.error('[API] GET /api/menu/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}