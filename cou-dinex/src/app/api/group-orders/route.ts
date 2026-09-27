import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Generate unique 6-character campus group share code
function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "DINE-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groupOrders = await prisma.groupOrder.findMany({
      where: {
        OR: [
          { creatorId: userSession.userId },
          { members: { some: { userId: userSession.userId } } },
        ],
      },
      include: {
        creator: {
          select: { id: true, fullName: true, phone: true },
        },
        members: {
          include: {
            user: { select: { id: true, fullName: true } },
            items: {
              include: { menuItem: { select: { id: true, name: true, price: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      groupOrders: groupOrders.map((go) => ({
        id: go.id,
        title: go.title,
        shareCode: go.shareCode,
        status: go.status,
        creator: go.creator,
        memberCount: go.members.length,
        isCreator: go.creatorId === userSession.userId,
        expiresAt: go.expiresAt,
        createdAt: go.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("List group orders failed:", error);
    return NextResponse.json({ error: "Failed to fetch group orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, expiresMinutes } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Group order title is required" }, { status: 400 });
    }

    let shareCode = generateShareCode();
    // Ensure uniqueness
    let existing = await prisma.groupOrder.findUnique({ where: { shareCode } });
    while (existing) {
      shareCode = generateShareCode();
      existing = await prisma.groupOrder.findUnique({ where: { shareCode } });
    }

    const expiresAt = expiresMinutes
      ? new Date(Date.now() + Number(expiresMinutes) * 60 * 1000)
      : new Date(Date.now() + 60 * 60 * 1000); // 1 hour default

    // Create group order and automatically add creator as first member
    const groupOrder = await prisma.groupOrder.create({
      data: {
        title: title.trim(),
        shareCode,
        creatorId: userSession.userId,
        expiresAt,
        members: {
          create: {
            userId: userSession.userId,
          },
        },
      },
      include: {
        creator: {
          select: { id: true, fullName: true, phone: true },
        },
        members: {
          include: {
            user: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      groupOrder: {
        id: groupOrder.id,
        title: groupOrder.title,
        shareCode: groupOrder.shareCode,
        status: groupOrder.status,
        creator: groupOrder.creator,
        expiresAt: groupOrder.expiresAt,
      },
    });
  } catch (error: any) {
    console.error("Create group order failed:", error);
    return NextResponse.json({ error: "Failed to create group order" }, { status: 500 });
  }
}
