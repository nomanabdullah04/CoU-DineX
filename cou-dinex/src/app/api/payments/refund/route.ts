import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaymentGateway } from "@/lib/payment/gateway-factory";
import { PaymentMethod } from "@/lib/payment/types";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin or Cafeteria Admin can process refunds
    if (user.role !== "SUPER_ADMIN" && user.role !== "CAFETERIA_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only cafeteria admins can process refunds" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { orderId, reason } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order || !order.payment) {
      return NextResponse.json({ error: "Order or payment record not found" }, { status: 404 });
    }

    const gateway = getPaymentGateway(order.payment.method as PaymentMethod);
    const refundResult = await gateway.refund({
      orderId: order.id,
      paymentId: order.payment.id,
      amount: parseFloat(order.payment.amount.toString()),
      reason: reason || "Administrative refund",
      refundedBy: user.fullName || "Admin",
    });

    return NextResponse.json({
      success: true,
      message: "Refund processed successfully",
      refund: refundResult,
    });
  } catch (error) {
    console.error("[API] POST /api/payments/refund error:", error);
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    );
  }
}
