import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OrderStatus, PaymentStatus, NotificationType } from "@prisma/client";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(_req: NextRequest, { params }: Props) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
        deliveryTracking: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Authorization check: student can only cancel their own order, or admin
    const isAdmin = user.role === "CAFETERIA_ADMIN" || user.role === "SUPER_ADMIN";
    if (order.userId !== user.userId && !isAdmin) {
      return NextResponse.json({ error: "Forbidden. You can only cancel your own orders." }, { status: 403 });
    }

    // State machine check: Cancellation allowed ONLY in PENDING or CONFIRMED state
    const cancellableStatuses: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          error: `Order #${order.orderNumber} cannot be cancelled because it is already ${order.status.replace(
            /_/g,
            " "
          ).toLowerCase()}. Food preparation or delivery is already in progress.`,
        },
        { status: 400 }
      );
    }

    // Execute atomic transaction: Cancel order, restock inventory, update payment & tracking
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // 1. Update order status
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
        },
      });

      // 2. Restock inventory for each order item
      for (const item of order.orderItems) {
        const inv = await tx.inventory.findUnique({
          where: { menuItemId: item.menuItemId },
        });

        if (inv) {
          const restoredStock = inv.currentStock + item.quantity;
          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              currentStock: restoredStock,
              isSoldOut: false, // item is no longer sold out since stock was returned
            },
          });
        }
      }

      // 3. Update payment status if exists
      await tx.payment.updateMany({
        where: { orderId: id },
        data: {
          status: PaymentStatus.FAILED, // or cancelled
        },
      });

      // 4. Update delivery tracking log
      const currentLogs = Array.isArray(order.deliveryTracking?.trackingLogs)
        ? (order.deliveryTracking?.trackingLogs as any[])
        : [];
      
      const newLog = {
        event: "ORDER_CANCELLED",
        cancelledBy: user.fullName,
        timestamp: new Date().toISOString(),
        reason: "Customer cancelled before preparation",
      };

      if (order.deliveryTracking) {
        await tx.deliveryTracking.update({
          where: { orderId: id },
          data: {
            trackingLogs: [...currentLogs, newLog],
          },
        });
      }

      // 5. Create in-app notification for user
      await tx.notification.create({
        data: {
          userId: order.userId,
          type: NotificationType.ORDER_UPDATE,
          title: "Order Cancelled",
          body: `Order #${order.orderNumber} was cancelled successfully and reserved inventory was restored.`,
          actionUrl: `/orders/${order.id}`,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: `Order #${order.orderNumber} cancelled successfully.`,
      order: cancelledOrder,
    });
  } catch (error) {
    console.error("[Cancel Order API] Error:", error);
    return NextResponse.json({ error: "Failed to cancel order. Please try again." }, { status: 500 });
  }
}
