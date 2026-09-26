import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaymentGateway } from "@/lib/payment/gateway-factory";
import { PaymentMethod } from "@/lib/payment/types";
import { NotificationType } from "@prisma/client";
import { getDigitalReceipt } from "@/lib/payment/receipt-service";
import { sendNotification } from "@/lib/notifications/notification-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, paymentId, method, demoAccount, demoPin, simulatedOutcome } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== user.userId && user.role !== "SUPER_ADMIN" && user.role !== "CAFETERIA_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const paymentMethodToUse = (method || order.payment?.method || PaymentMethod.CASH_ON_DELIVERY) as PaymentMethod;
    const gateway = getPaymentGateway(paymentMethodToUse);

    const verifyResult = await gateway.verify({
      orderId: order.id,
      paymentId: paymentId || order.payment?.id || "",
      demoAccount,
      demoPin,
      simulatedOutcome,
    });

    if (verifyResult.success) {
      // In-app & push notification for successful payment
      await sendNotification({
        userId: order.userId,
        type: NotificationType.PAYMENT_SUCCESS,
        title: verifyResult.isDemo ? "Demo Payment Successful" : "Payment Received",
        body: `Payment of ৳${order.totalAmount} for order #${order.orderNumber} has been verified (${gateway.displayName}). Digital receipt generated.`,
        actionUrl: `/orders/${order.id}/receipt`,
      });

      // Fetch the full digital receipt
      const receipt = await getDigitalReceipt(order.id);

      return NextResponse.json({
        success: true,
        message: "Payment successfully verified and order confirmed.",
        verification: verifyResult,
        receipt,
      });
    } else {
      // Notification for failed payment
      await sendNotification({
        userId: order.userId,
        type: NotificationType.PAYMENT_FAILED,
        title: "Payment Failed",
        body: `Payment attempt for order #${order.orderNumber} was declined: ${verifyResult.errorMessage || "Please try another payment method."}`,
        actionUrl: `/orders/${order.id}`,
      });

      return NextResponse.json(
        {
          success: false,
          error: verifyResult.errorMessage || "Payment verification failed",
          verification: verifyResult,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[API] POST /api/payments/verify error:", error);
    return NextResponse.json(
      { error: "Internal error during payment verification" },
      { status: 500 }
    );
  }
}
