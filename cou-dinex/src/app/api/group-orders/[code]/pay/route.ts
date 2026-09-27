import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PaymentMethod } from "@prisma/client";

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
    const { paymentMethod = "BKASH" } = body;

    const groupOrder = await prisma.groupOrder.findUnique({
      where: { shareCode: normalizedCode },
      include: {
        members: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!groupOrder) {
      return NextResponse.json({ error: "Group order not found" }, { status: 404 });
    }

    if (groupOrder.status !== "OPEN" && groupOrder.status !== "LOCKED") {
      return NextResponse.json({ error: "Group order cannot accept payments in status: " + groupOrder.status }, { status: 400 });
    }

    // Find member
    const member = groupOrder.members.find((m) => m.userId === userSession.userId);
    if (!member) {
      return NextResponse.json({ error: "You are not a member of this group order" }, { status: 403 });
    }

    const memberSubtotal = member.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    if (memberSubtotal <= 0) {
      return NextResponse.json({ error: "Your plate is empty. Add food items before making payment." }, { status: 400 });
    }

    // Compute split delivery fee
    const deliveryFee = 20;
    const activeMemberCount = Math.max(1, groupOrder.members.length);
    const splitFee = Math.round(deliveryFee / activeMemberCount);
    const totalDue = memberSubtotal + splitFee;

    // Secure simulated split transaction
    const transactionId = `SPLIT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const validPaymentMethod = Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)
      ? (paymentMethod as PaymentMethod)
      : PaymentMethod.BKASH;

    // Update member record securely
    const updatedMember = await prisma.groupMember.update({
      where: { id: member.id },
      data: {
        hasPaid: true,
        amountShare: totalDue,
        paymentMethod: validPaymentMethod,
        transactionId,
        paidAt: new Date(),
      },
    });

    // Check if all active members have now settled
    const allMembersUpdated = await prisma.groupMember.findMany({
      where: { groupOrderId: groupOrder.id },
      include: { items: true },
    });

    const activeMembers = allMembersUpdated.filter((m) => m.items.length > 0);
    const allSettled = activeMembers.length > 0 && activeMembers.every((m) => m.hasPaid);

    return NextResponse.json({
      success: true,
      message: "Split share payment confirmed successfully",
      splitPayment: {
        memberId: updatedMember.id,
        amountPaid: totalDue,
        paymentMethod: updatedMember.paymentMethod,
        transactionId: updatedMember.transactionId,
        paidAt: updatedMember.paidAt,
        isFullySettled: allSettled,
      },
    });
  } catch (error: any) {
    console.error("Split payment failed:", error);
    return NextResponse.json({ error: "Failed to process split payment" }, { status: 500 });
  }
}
