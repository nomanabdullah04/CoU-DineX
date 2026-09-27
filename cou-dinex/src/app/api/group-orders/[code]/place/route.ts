import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { DeliveryType, PaymentMethod, PaymentStatus, OrderStatus } from "@prisma/client";

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

    const groupOrder = await prisma.groupOrder.findUnique({
      where: { shareCode: normalizedCode },
      include: {
        members: {
          include: {
            user: true,
            items: {
              include: { menuItem: true },
            },
          },
        },
      },
    });

    if (!groupOrder) {
      return NextResponse.json({ error: "Group order not found" }, { status: 404 });
    }

    // Only creator / host can finalize and place
    if (groupOrder.creatorId !== userSession.userId) {
      return NextResponse.json({ error: "Only the group host can finalize and place this order." }, { status: 403 });
    }

    if (groupOrder.status === "PLACED") {
      return NextResponse.json({ error: "This group order has already been placed." }, { status: 400 });
    }

    // Flatten all member items
    const allItems: Array<{
      menuItemId: string;
      quantity: number;
      unitPrice: number;
      notes: string | null;
      userName: string;
    }> = [];

    groupOrder.members.forEach((member) => {
      member.items.forEach((item) => {
        allItems.push({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          notes: item.notes ? `${member.user.fullName}: ${item.notes}` : `For: ${member.user.fullName}`,
          userName: member.user.fullName,
        });
      });
    });

    if (allItems.length === 0) {
      return NextResponse.json({ error: "No food items have been added to this group order yet." }, { status: 400 });
    }

    // Default cafeteria
    const cafeteria = await prisma.cafeteria.findFirst();
    if (!cafeteria) {
      return NextResponse.json({ error: "No active cafeteria found" }, { status: 400 });
    }

    const subtotal = allItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const deliveryFee = 20;
    const totalAmount = subtotal + deliveryFee;

    const orderNumber = `GRP-${Date.now().toString().slice(-6)}`;

    // Create the master order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: userSession.userId,
        cafeteriaId: cafeteria.id,
        deliveryType: DeliveryType.CAFETERIA_PICKUP,
        status: OrderStatus.CONFIRMED,
        subtotal,
        deliveryFee,
        totalAmount,
        notes: `Campus Group Order (${groupOrder.title} • Code: ${groupOrder.shareCode})`,
        groupOrderId: groupOrder.id,
        orderItems: {
          create: allItems.map((it) => ({
            menuItemId: it.menuItemId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.unitPrice * it.quantity,
            specialInstructions: it.notes,
          })),
        },
        payment: {
          create: {
            amount: totalAmount,
            method: PaymentMethod.WALLET,
            status: PaymentStatus.PAID,
            transactionId: `GRP-SPLIT-${groupOrder.shareCode}`,
            receiptNumber: `RCP-GRP-${Date.now()}`,
          },
        },
      },
    });

    // Mark group order as PLACED
    await prisma.groupOrder.update({
      where: { id: groupOrder.id },
      data: { status: "PLACED" },
    });

    return NextResponse.json({
      success: true,
      message: "Group order successfully locked and placed to cafeteria kitchen!",
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error: any) {
    console.error("Place group order failed:", error);
    return NextResponse.json({ error: "Failed to place group order" }, { status: 500 });
  }
}
