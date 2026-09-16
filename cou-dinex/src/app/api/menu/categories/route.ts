import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const categories = await prisma.menuCategory.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { items: { where: { isAvailable: true } } } },
      },
      orderBy: { displayOrder: 'asc' },
    });

    const result = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      cafeteriaId: c.cafeteriaId,
      itemCount: c._count.items,
    }));

    return NextResponse.json({ categories: result });
  } catch (error) {
    console.error('[API] GET /api/menu/categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
