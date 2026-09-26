import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PAYMENT_METHOD_CONFIGS } from "@/lib/payment/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Can look up either by Payment ID or Order ID
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ id }, { orderId: id }],
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            userId: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.order.userId !== user.userId && user.role !== "SUPER_ADMIN" && user.role !== "CAFETERIA_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const config = PAYMENT_METHOD_CONFIGS[payment.method];

    return NextResponse.json({
      paymentId: payment.id,
      orderId: payment.orderId,
      orderNumber: payment.order.orderNumber,
      orderStatus: payment.order.status,
      status: payment.status,
      amount: parseFloat(payment.amount.toString()),
      method: payment.method,
      methodDisplay: config?.name || payment.method,
      isDemo: payment.isDemo,
      transactionId: payment.transactionId,
      receiptNumber: payment.receiptNumber,
      paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("[API] GET /api/payments/[id]/status error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve payment status" },
      { status: 500 }
    );
  }
}
