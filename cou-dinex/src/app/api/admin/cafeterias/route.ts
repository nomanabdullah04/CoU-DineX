import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

function isAdmin(role: string) {
  return ['CAFETERIA_ADMIN', 'SUPER_ADMIN'].includes(role);
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const cafeterias = await prisma.cafeteria.findMany({
      select: { id: true, name: true, isOpen: true, location: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ cafeterias });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch cafeterias' }, { status: 500 });
  }
}