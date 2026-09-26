import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OrderStatus, PaymentStatus, DeliveryStatus, NotificationType } from "@prisma/client";

type Props = { params: Promise<{ id: string }> };

// State Machine Transition Rules Map
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY_FOR_PICKUP],
  READY_FOR_PICKUP: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
  DELIVERED: [], // Terminal
  CANCELLED: [], // Terminal
  REJECTED: [],  // Terminal
};

export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Kitchen Staff, Cafeteria Admin, or Super Admin can advance order lifecycle
    const isKitchenAuthorized =
      user.role === "CAFETERIA_STAFF" ||
      user.role === "CAFETERIA_ADMIN" ||
      user.role === "SUPER_ADMIN";
    if (!isKitchenAuthorized) {
      return NextResponse.json(
        { error: "Forbidden. Kitchen staff or admin authorization required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { status: targetStatus, note } = body;

    if (!targetStatus || !Object.values(OrderStatus).includes(targetStatus)) {
      return NextResponse.json({ error: "Invalid status value provided." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        deliveryTracking: true,
        cafeteria: { select: { name: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // 1. Check State Machine Transition Validity
    const currentStatus = order.status;
    const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowedTargets.includes(targetStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition: Cannot change order from "${currentStatus}" to "${targetStatus}". Allowed next states are: ${
            allowedTargets.length > 0 ? allowedTargets.join(", ") : "None (Terminal state)"
          }.`,
        },
        { status: 400 }
      );
    }

    // 2. Execute Transition in Database Transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 2.1 Update Order status
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: targetStatus,
        },
      });

      // 2.2 Update Payment if Delivered
      if (targetStatus === OrderStatus.DELIVERED) {
        await tx.payment.updateMany({
          where: { orderId: id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
          },
        });
      }

      // 2.3 Update DeliveryTracking logs
      const currentLogs = Array.isArray(order.deliveryTracking?.trackingLogs)
        ? (order.deliveryTracking?.trackingLogs as any[])
        : [];

      const transitionLog = {
        event: `STATUS_CHANGED_TO_${targetStatus}`,
        from: currentStatus,
        to: targetStatus,
        updatedBy: user.fullName,
        timestamp: new Date().toISOString(),
        note: note || undefined,
      };

      let deliveryStatusUpdate: DeliveryStatus | undefined = undefined;
      if (targetStatus === OrderStatus.PREPARING) deliveryStatusUpdate = DeliveryStatus.ASSIGNED;
      if (targetStatus === OrderStatus.READY_FOR_PICKUP) deliveryStatusUpdate = DeliveryStatus.PICKED_UP;
      if (targetStatus === OrderStatus.OUT_FOR_DELIVERY) deliveryStatusUpdate = DeliveryStatus.ON_THE_WAY;
      if (targetStatus === OrderStatus.DELIVERED) deliveryStatusUpdate = DeliveryStatus.DELIVERED;

      await tx.deliveryTracking.upsert({
        where: { orderId: id },
        create: {
          orderId: id,
          status: deliveryStatusUpdate || DeliveryStatus.PENDING,
          actualDeliveryTime: targetStatus === OrderStatus.DELIVERED ? new Date() : undefined,
          trackingLogs: [transitionLog],
        },
        update: {
          status: deliveryStatusUpdate || order.deliveryTracking?.status || DeliveryStatus.PENDING,
          actualDeliveryTime: targetStatus === OrderStatus.DELIVERED ? new Date() : undefined,
          trackingLogs: [...currentLogs, transitionLog],
        },
      });

      // 2.4 Notify student of status update
      const statusTitleMap: Record<string, string> = {
        CONFIRMED: "Order Confirmed!",
        PREPARING: "Kitchen Cooking Started",
        READY_FOR_PICKUP: "Your Meal is Ready!",
        OUT_FOR_DELIVERY: "Food Out for Delivery!",
        DELIVERED: "Order Completed!",
        CANCELLED: "Order Cancelled",
      };

      const statusTypeMap: Record<string, NotificationType> = {
        CONFIRMED: NotificationType.ORDER_CONFIRMED,
        PREPARING: NotificationType.ORDER_PREPARING,
        READY_FOR_PICKUP: NotificationType.ORDER_READY,
        OUT_FOR_DELIVERY: NotificationType.ORDER_OUT_FOR_DELIVERY,
        DELIVERED: NotificationType.ORDER_DELIVERED,
      };

      const notificationType = statusTypeMap[targetStatus] || NotificationType.ORDER_UPDATE;

      await tx.notification.create({
        data: {
          userId: order.userId,
          type: notificationType,
          title: statusTitleMap[targetStatus] || "Order Status Updated",
          body: `Order #${order.orderNumber} is now ${targetStatus.replace(/_/g, " ")}.`,
          actionUrl: `/orders/${order.id}`,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: `Order #${order.orderNumber} transitioned from ${currentStatus} to ${targetStatus}.`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("[Order Status Transition API] Error:", error);
    return NextResponse.json({ error: "Failed to update order status." }, { status: 500 });
  }
}
