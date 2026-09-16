import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

function isAdmin(role: string) {
  return ['CAFETERIA_ADMIN', 'SUPER_ADMIN'].includes(role);
}

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: { category: true, inventory: true, cafeteria: true },
    });

    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, price, discountPrice, imageUrl, isAvailable, isDailySpecial,
      preparationTimeMinutes, tags, categoryId, currentStock } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (discountPrice !== undefined) updateData.discountPrice = discountPrice;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (isDailySpecial !== undefined) updateData.isDailySpecial = isDailySpecial;
    if (preparationTimeMinutes !== undefined) updateData.preparationTimeMinutes = preparationTimeMinutes;
    if (tags !== undefined) updateData.tags = tags;
    if (categoryId !== undefined) updateData.categoryId = categoryId;

    const item = await prisma.menuItem.update({
      where: { id },
      data: updateData,
      include: { category: true, inventory: true, cafeteria: true },
    });

    if (currentStock !== undefined) {
      await prisma.inventory.upsert({
        where: { menuItemId: id },
        update: {
          currentStock,
          isSoldOut: currentStock === 0,
        },
        create: {
          menuItemId: id,
          cafeteriaId: item.cafeteriaId,
          currentStock,
          dailyStartingStock: currentStock,
          isSoldOut: currentStock === 0,
        },
      });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.menuItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}