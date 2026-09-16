import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

function isAdmin(role: string) {
  return ['CAFETERIA_ADMIN', 'SUPER_ADMIN'].includes(role);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const [items, total] = await Promise.all([
      prisma.menuItem.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          inventory: true,
          cafeteria: { select: { id: true, name: true } },
          _count: { select: { reviews: true, orderItems: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.menuItem.count({ where }),
    ]);

    const enriched = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price.toString()),
      discountPrice: item.discountPrice ? parseFloat(item.discountPrice.toString()) : null,
      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
      isDailySpecial: item.isDailySpecial,
      preparationTimeMinutes: item.preparationTimeMinutes,
      tags: item.tags,
      category: item.category,
      cafeteria: item.cafeteria,
      inventory: item.inventory,
      reviewCount: item._count.reviews,
      orderCount: item._count.orderItems,
    }));

    return NextResponse.json({
      items: enriched,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Admin API] GET /api/admin/menu error:', error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, discountPrice, imageUrl, isAvailable, isDailySpecial,
      preparationTimeMinutes, tags, categoryId, cafeteriaId, initialStock } = body;

    if (!name || !price || !categoryId || !cafeteriaId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        description,
        price,
        discountPrice: discountPrice || null,
        imageUrl,
        isAvailable: isAvailable ?? true,
        isDailySpecial: isDailySpecial ?? false,
        preparationTimeMinutes: preparationTimeMinutes ?? 15,
        tags: tags ?? [],
        categoryId,
        cafeteriaId,
        inventory: {
          create: {
            cafeteriaId,
            currentStock: initialStock ?? 0,
            dailyStartingStock: initialStock ?? 0,
            isSoldOut: (initialStock ?? 0) === 0,
          },
        },
      },
      include: { category: true, inventory: true, cafeteria: true },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('[Admin API] POST /api/admin/menu error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}