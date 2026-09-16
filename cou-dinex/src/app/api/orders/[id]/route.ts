import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Props) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        cafeteria: {
          select: {
            id: true,
            name: true,
            location: true,
            openingTime: true,
            closingTime: true,
          },
        },
        table: {
          select: {
            id: true,
            tableNumber: true,
          },
        },
        deliveryLocation: {
          include: {
            hall: { select: { name: true, code: true } },
            department: { select: { name: true, code: true } },
          },
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                preparationTimeMinutes: true,
              },
            },
          },
        },
        payment: true,
        deliveryTracking: {
          include: {
            agent: {
              include: {
                user: { select: { fullName: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Security check: ensure student owns this order or is admin
    const isAdmin = user.role === "CAFETERIA_ADMIN" || user.role === "SUPER_ADMIN";
    if (order.userId !== user.userId && !isAdmin) {
      return NextResponse.json({ error: "Forbidden. You cannot view this order." }, { status: 403 });
    }

    // Cancellation check: allowed only in PENDING or CONFIRMED
    const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";

    // Extract logged transition timestamps from trackingLogs
    const logs = Array.isArray(order.deliveryTracking?.trackingLogs)
      ? (order.deliveryTracking?.trackingLogs as any[])
      : [];

    const getTimestampForEvent = (eventPattern: string): string | null => {
      const match = logs.find((l) => l.event && l.event.includes(eventPattern));
      return match ? match.timestamp : null;
    };

    const isDelivery = order.deliveryType === "HALL_DELIVERY" || order.deliveryType === "DEPARTMENT_DELIVERY";

    // Build timeline stages matching SRS & Phase 8 lifecycle
    const timeline = [
      {
        key: "PENDING",
        label: "Order Placed",
        description: "Received by cafeteria counter",
        timestamp: order.createdAt.toISOString(),
        completed: true,
      },
      {
        key: "CONFIRMED",
        label: "Confirmed",
        description: "Kitchen verified ticket",
        timestamp: getTimestampForEvent("CONFIRMED") || (order.status !== "PENDING" && order.status !== "CANCELLED" ? order.updatedAt.toISOString() : null),
        completed: ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status),
      },
      {
        key: "PREPARING",
        label: "Preparing",
        description: "Chef is cooking your food",
        timestamp: getTimestampForEvent("PREPARING"),
        completed: ["PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status),
      },
      {
        key: "READY_FOR_PICKUP",
        label: "Ready",
        description: isDelivery ? "Packaged for delivery" : "Ready at cafeteria counter",
        timestamp: getTimestampForEvent("READY"),
        completed: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status),
      },
      ...(isDelivery
        ? [
            {
              key: "OUT_FOR_DELIVERY",
              label: "Out for Delivery",
              description: "Rider on the way to your destination",
              timestamp: getTimestampForEvent("OUT_FOR_DELIVERY"),
              completed: ["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status),
            },
          ]
        : []),
      {
        key: "DELIVERED",
        label: isDelivery ? "Delivered" : "Order Picked Up",
        description: isDelivery ? "Handed over at destination" : "Picked up from cafeteria",
        timestamp: getTimestampForEvent("DELIVERED") || (order.status === "DELIVERED" ? order.updatedAt.toISOString() : null),
        completed: order.status === "DELIVERED",
      },
    ];

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        canCancel,
        timeline,
      },
    });
  } catch (error) {
    console.error("[Order Tracking API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}
