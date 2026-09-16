import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('category') || '';
    const available = searchParams.get('available');
    const sort = searchParams.get('sort') || 'popular';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (available === 'true') {
      where.isAvailable = true;
    } else if (available === 'false') {
      where.isAvailable = false;
    }

    let orderBy: Record<string, unknown> = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    else if (sort === 'price_desc') orderBy = { price: 'desc' };
    else if (sort === 'newest') orderBy = { createdAt: 'desc' };

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.menuItem.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          inventory: { select: { currentStock: true, isSoldOut: true } },
          reviews: { select: { rating: true } },
          cafeteria: { select: { id: true, name: true, isOpen: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.menuItem.count({ where }),
    ]);

    const enriched = items.map((item) => {
      const ratings = item.reviews.map((r) => r.rating);
      const avgRating = ratings.length > 0
        ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
        : null;
      const isSoldOut = !item.isAvailable || (item.inventory?.isSoldOut ?? false);

      return {
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
        currentStock: item.inventory?.currentStock ?? null,
        avgRating,
        reviewCount: item.reviews.length,
      };
    });

    if (sort === 'popular') {
      enriched.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    return NextResponse.json({
      items: enriched,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[API] GET /api/menu error:', error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}
