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

    const body = await req.json();
    const { orderId, method } = body;

    if (!orderId || !method) {
      return NextResponse.json(
        { error: "orderId and method are required" },
        { status: 400 }
      );
    }

    if (!Object.values(PaymentMethod).includes(method)) {
      return NextResponse.json(
        { error: `Invalid payment method: ${method}` },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check ownership unless admin/staff
    if (order.userId !== user.userId && user.role !== "SUPER_ADMIN" && user.role !== "CAFETERIA_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const gateway = getPaymentGateway(method as PaymentMethod);
    const result = await gateway.initiate({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: parseFloat(order.totalAmount.toString()),
      customerName: order.user.fullName,
      customerPhone: order.user.phone,
      customerEmail: order.user.email || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] POST /api/payments/initiate error:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
