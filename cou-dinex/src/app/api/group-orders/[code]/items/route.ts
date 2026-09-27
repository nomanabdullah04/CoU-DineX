import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await params;
    const normalizedCode = code.toUpperCase().trim();

    const body = await req.json();
    const { menuItemId, quantity = 1, notes } = body;

    if (!menuItemId) {
      return NextResponse.json({ error: "menuItemId is required" }, { status: 400 });
    }

    const groupOrder = await prisma.groupOrder.findUnique({
      where: { shareCode: normalizedCode },
    });

    if (!groupOrder) {
      return NextResponse.json({ error: "Group order not found" }, { status: 404 });
    }

    if (groupOrder.status !== "OPEN") {
      return NextResponse.json(
        { error: `Cannot modify items. Group order is ${groupOrder.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Ensure member exists
    let member = await prisma.groupMember.findUnique({
      where: {
        groupOrderId_userId: {
          groupOrderId: groupOrder.id,
          userId: userSession.userId,
        },
      },
    });

    if (!member) {
      member = await prisma.groupMember.create({
        data: {
          groupOrderId: groupOrder.id,
          userId: userSession.userId,
        },
      });
    }

    // Fetch menu item to ensure active and get current price
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!menuItem || !menuItem.isAvailable) {
      return NextResponse.json({ error: "Selected item is currently unavailable" }, { status: 400 });
    }

    const unitPrice = menuItem.discountPrice ?? menuItem.price;
    const finalQuantity = Math.max(1, Number(quantity));
    const totalPrice = Number(unitPrice) * finalQuantity;

    // Check if member already has this item on their plate
    const existingItem = await prisma.groupMemberItem.findFirst({
      where: {
        groupMemberId: member.id,
        menuItemId: menuItem.id,
      },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + finalQuantity;
      await prisma.groupMemberItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQty,
          totalPrice: Number(unitPrice) * newQty,
          notes: notes !== undefined ? notes : existingItem.notes,
        },
      });
    } else {
      await prisma.groupMemberItem.create({
        data: {
          groupMemberId: member.id,
          menuItemId: menuItem.id,
          quantity: finalQuantity,
          unitPrice,
          totalPrice,
          notes,
        },
      });
    }

    // Reset member hasPaid flag if items changed
    await prisma.groupMember.update({
      where: { id: member.id },
      data: { hasPaid: false },
    });

    return NextResponse.json({
      success: true,
      message: `Added ${menuItem.name} to your plate`,
    });
  } catch (error: any) {
    console.error("Add group item failed:", error);
    return NextResponse.json({ error: "Failed to add item to group order" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await params;
    const normalizedCode = code.toUpperCase().trim();

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const groupOrder = await prisma.groupOrder.findUnique({
      where: { shareCode: normalizedCode },
    });

    if (!groupOrder || groupOrder.status !== "OPEN") {
      return NextResponse.json({ error: "Cannot modify items. Group order is closed." }, { status: 400 });
    }

    const member = await prisma.groupMember.findUnique({
      where: {
        groupOrderId_userId: {
          groupOrderId: groupOrder.id,
          userId: userSession.userId,
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "You are not a member of this group" }, { status: 403 });
    }

    // Delete item if it belongs to this member
    await prisma.groupMemberItem.deleteMany({
      where: {
        id: itemId,
        groupMemberId: member.id,
      },
    });

    // Reset member hasPaid flag
    await prisma.groupMember.update({
      where: { id: member.id },
      data: { hasPaid: false },
    });

    return NextResponse.json({
      success: true,
      message: "Item removed from your plate",
    });
  } catch (error: any) {
    console.error("Delete group item failed:", error);
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
  }
}
