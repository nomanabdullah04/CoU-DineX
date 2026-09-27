import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
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
        creator: {
          select: { id: true, fullName: true, phone: true },
        },
        members: {
          include: {
            user: { select: { id: true, fullName: true, phone: true } },
            items: {
              include: {
                menuItem: {
                  select: { id: true, name: true, price: true, imageUrl: true },
                },
              },
            },
          },
        },
        orders: {
          select: { id: true, orderNumber: true, status: true, totalAmount: true },
        },
      },
    });

    if (!groupOrder) {
      return NextResponse.json({ error: "Group order not found with code: " + normalizedCode }, { status: 404 });
    }

    // Standard campus delivery fee for group orders
    const deliveryFee = 20; // ৳20 campus delivery
    const discount = 0;

    // Calculate individual member subtotals and grand totals
    let grandSubtotal = 0;
    const membersWithTotals = groupOrder.members.map((member) => {
      const memberSubtotal = member.items.reduce(
        (sum, item) => sum + Number(item.totalPrice),
        0
      );
      grandSubtotal += memberSubtotal;
      return {
        id: member.id,
        userId: member.userId,
        userName: member.user.fullName,
        userPhone: member.user.phone,
        hasPaid: member.hasPaid,
        paymentMethod: member.paymentMethod,
        transactionId: member.transactionId,
        paidAt: member.paidAt,
        itemsSubtotal: memberSubtotal,
        itemCount: member.items.reduce((sum, item) => sum + item.quantity, 0),
        items: member.items.map((it) => ({
          id: it.id,
          menuItemId: it.menuItemId,
          name: it.menuItem.name,
          unitPrice: Number(it.unitPrice),
          quantity: it.quantity,
          totalPrice: Number(it.totalPrice),
          imageUrl: it.menuItem.imageUrl,
          notes: it.notes,
        })),
      };
    });

    // Compute equal split of delivery fee across members who have added items (or all members)
    const activeMemberCount = Math.max(1, membersWithTotals.length);
    const splitFeePerMember = Math.round(deliveryFee / activeMemberCount);

    const calculatedMembers = membersWithTotals.map((m) => {
      const memberTotal = m.itemsSubtotal > 0 ? m.itemsSubtotal + splitFeePerMember : 0;
      return {
        ...m,
        splitFee: m.itemsSubtotal > 0 ? splitFeePerMember : 0,
        individualTotal: memberTotal,
      };
    });

    const grandTotal = grandSubtotal + deliveryFee - discount;
    const totalPaidAmount = calculatedMembers
      .filter((m) => m.hasPaid)
      .reduce((sum, m) => sum + m.individualTotal, 0);

    const isFullyPaid = calculatedMembers.length > 0 && calculatedMembers.every((m) => m.hasPaid || m.individualTotal === 0);

    // Query active menu items with category for cafeteria menu
    const menuItems = await prisma.menuItem.findMany({
      where: { isAvailable: true },
      include: {
        category: { select: { id: true, name: true } },
        cafeteria: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    const cafeteriaMenu = menuItems.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      price: Number(m.price),
      category: m.category?.name || "General",
      isAvailable: m.isAvailable,
      imageUrl: m.imageUrl,
    }));

    const currentMember = groupOrder.members.find((m) => m.userId === userSession.userId);
    const currentCalculated = calculatedMembers.find((m) => m.userId === userSession.userId);

    const currentUserObj = {
      studentId: userSession.userId,
      name: userSession.fullName || "Student",
      isHost: groupOrder.creatorId === userSession.userId,
      isMember: Boolean(currentMember),
      memberId: currentMember?.id,
      isPaid: currentMember?.hasPaid || false,
      myTotalShare: currentCalculated?.individualTotal || 0,
      myItems: (currentMember?.items || []).map((it) => ({
        id: it.id,
        menuItemId: it.menuItemId,
        name: it.menuItem.name,
        price: Number(it.unitPrice),
        quantity: it.quantity,
        totalPrice: Number(it.totalPrice),
        specialInstructions: it.notes,
      })),
    };

    const formattedMembers = calculatedMembers.map((m) => ({
      id: m.id,
      studentId: m.userId,
      name: m.userName,
      role: m.userId === groupOrder.creatorId ? "Host" : "Member",
      isPaid: m.hasPaid,
      paymentMethod: m.paymentMethod,
      transactionId: m.transactionId,
      itemCount: m.itemCount,
      itemSubtotal: m.itemsSubtotal,
      splitDeliveryShare: m.splitFee,
      totalShare: m.individualTotal,
      items: m.items.map((it) => ({
        id: it.id,
        menuItemId: it.menuItemId,
        name: it.name,
        price: it.unitPrice,
        quantity: it.quantity,
        totalPrice: it.totalPrice,
        specialInstructions: it.notes,
      })),
    }));

    const cafeteriaName = menuItems[0]?.cafeteria?.name || "CoU Central Cafeteria";
    const cafeteriaId = menuItems[0]?.cafeteriaId || "cou-central";
    const activeDinersCount = calculatedMembers.filter((m) => m.itemsSubtotal > 0).length;

    const responsePayload = {
      success: true,
      id: groupOrder.id,
      code: groupOrder.shareCode,
      title: groupOrder.title,
      status: groupOrder.status === "PLACED" ? "ORDERED" : groupOrder.status,
      cafeteriaId,
      cafeteriaName,
      hostName: groupOrder.creator.fullName,
      hostStudentId: groupOrder.creator.id,
      deliveryLocation: "Campus Central Point / Counter",
      deliveryType: "CAMPUS_SPLIT",
      createdAt: groupOrder.createdAt.toISOString(),
      orderId: groupOrder.orders[0]?.id || null,
      memberCount: calculatedMembers.length,
      activeDinersCount,
      totalFoodAmount: grandSubtotal,
      sharedDeliveryFee: deliveryFee,
      grandTotal,
      currentUser: currentUserObj,
      members: formattedMembers,
      cafeteriaMenu,
      // Keep groupOrder wrapper for any backwards-compatibility
      groupOrder: {
        id: groupOrder.id,
        title: groupOrder.title,
        shareCode: groupOrder.shareCode,
        status: groupOrder.status,
        creator: groupOrder.creator,
        isCreator: groupOrder.creatorId === userSession.userId,
        expiresAt: groupOrder.expiresAt,
        createdAt: groupOrder.createdAt,
        activeKitchenOrder: groupOrder.orders[0] || null,
        financials: {
          grandSubtotal,
          deliveryFee,
          discount,
          grandTotal,
          totalPaidAmount,
          remainingAmount: Math.max(0, grandTotal - totalPaidAmount),
          isFullyPaid,
        },
        members: calculatedMembers,
      },
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error("Get group order details failed:", error);
    return NextResponse.json({ error: "Failed to retrieve group order" }, { status: 500 });
  }
}

// Join Group Order via Share Code
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
    });

    if (!groupOrder) {
      return NextResponse.json({ error: "Invalid share code. Group order not found." }, { status: 404 });
    }

    if (groupOrder.status !== "OPEN") {
      return NextResponse.json({ error: "This group order is " + groupOrder.status.toLowerCase() + " and no longer accepting new members." }, { status: 400 });
    }

    // Check if already a member
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

    return NextResponse.json({
      success: true,
      message: "Successfully joined group order",
      groupOrderId: groupOrder.id,
      shareCode: groupOrder.shareCode,
    });
  } catch (error: any) {
    console.error("Join group order failed:", error);
    return NextResponse.json({ error: "Failed to join group order" }, { status: 500 });
  }
}
