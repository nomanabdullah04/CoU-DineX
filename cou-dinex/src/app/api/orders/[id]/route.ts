import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Props) {
  try {
    const user = await getSessionUser(req);
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

    // Calculate estimated preparation & delivery duration based on menu items
    const prepMinutesList = order.orderItems.map((item) => item.menuItem?.preparationTimeMinutes || 15);
    const maxPrepMinutes = prepMinutesList.length > 0 ? Math.max(...prepMinutesList) : 15;
    const createdAtMs = new Date(order.createdAt).getTime();

    // Helper to format ISO strings for fallbacks
    const confirmedTimeMs = createdAtMs + 2 * 60 * 1000;
    const preparingTimeMs = createdAtMs + 5 * 60 * 1000;
    const readyTimeMs = createdAtMs + maxPrepMinutes * 60 * 1000;
    const outTimeMs = readyTimeMs + 5 * 60 * 1000;
    const deliveryTimeMs = readyTimeMs + (isDelivery ? 20 : 5) * 60 * 1000;

    const confirmedLog = getTimestampForEvent("CONFIRMED");
    const preparingLog = getTimestampForEvent("PREPARING");
    const readyLog = getTimestampForEvent("READY");
    const outLog = getTimestampForEvent("OUT_FOR_DELIVERY");
    const deliveredLog = getTimestampForEvent("DELIVERED");

    const isConfirmedOrLater = ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status);
    const isPreparingOrLater = ["PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status);
    const isReadyOrLater = ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status);
    const isOutOrLater = ["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status);
    const isDelivered = order.status === "DELIVERED";

    // Build timeline stages matching SRS & Phase 8 lifecycle
    const timeline = [
      {
        key: "PENDING",
        label: "Order Placed",
        description: "Received by cafeteria counter",
        timestamp: order.createdAt.toISOString(),
        completed: true,
        estimated: false,
      },
      {
        key: "CONFIRMED",
        label: "Confirmed",
        description: "Kitchen verified ticket",
        timestamp: confirmedLog || (isConfirmedOrLater ? (order.status === "CONFIRMED" ? order.updatedAt.toISOString() : new Date(confirmedTimeMs).toISOString()) : new Date(confirmedTimeMs).toISOString()),
        completed: isConfirmedOrLater,
        estimated: !isConfirmedOrLater && !confirmedLog,
      },
      {
        key: "PREPARING",
        label: "Preparing",
        description: "Chef is cooking your food",
        timestamp: preparingLog || (isPreparingOrLater ? (order.status === "PREPARING" ? order.updatedAt.toISOString() : new Date(preparingTimeMs).toISOString()) : new Date(preparingTimeMs).toISOString()),
        completed: isPreparingOrLater,
        estimated: !isPreparingOrLater && !preparingLog,
      },
      {
        key: "READY_FOR_PICKUP",
        label: isDelivery ? "Packaged" : "Ready",
        description: isDelivery ? "Kitchen packaged • Awaiting rider" : "Ready at cafeteria counter",
        timestamp: readyLog || (isReadyOrLater ? (order.status === "READY_FOR_PICKUP" ? order.updatedAt.toISOString() : new Date(readyTimeMs).toISOString()) : new Date(readyTimeMs).toISOString()),
        completed: isReadyOrLater,
        estimated: !isReadyOrLater && !readyLog,
      },
      ...(isDelivery
        ? [
            {
              key: "OUT_FOR_DELIVERY",
              label: "Out for Delivery",
              description: "Rider on the way to your destination",
              timestamp: outLog || (isOutOrLater ? (order.status === "OUT_FOR_DELIVERY" ? order.updatedAt.toISOString() : new Date(outTimeMs).toISOString()) : new Date(outTimeMs).toISOString()),
              completed: isOutOrLater,
              estimated: !isOutOrLater && !outLog,
            },
          ]
        : []),
      {
        key: "DELIVERED",
        label: isDelivery ? "Delivered" : "Order Picked Up",
        description: isDelivery ? "Handed over at destination" : "Picked up from cafeteria",
        timestamp: deliveredLog || (isDelivered ? order.updatedAt.toISOString() : (order.deliveryTracking?.estimatedDeliveryTime ? new Date(order.deliveryTracking.estimatedDeliveryTime).toISOString() : new Date(deliveryTimeMs).toISOString())),
        completed: isDelivered,
        estimated: !isDelivered && !deliveredLog,
      },
    ];

    // Sanitize delivery tracking: once delivered, terminate active tracking and hide rider contact
    const deliveryTracking = order.deliveryTracking
      ? {
          ...order.deliveryTracking,
          agent: isDelivered ? null : order.deliveryTracking.agent,
          currentLatitude: isDelivered ? null : order.deliveryTracking.currentLatitude,
          currentLongitude: isDelivered ? null : order.deliveryTracking.currentLongitude,
          deliveryOtp: isDelivered ? null : order.deliveryTracking.deliveryOtp,
          pickupOtp: isDelivered ? null : order.deliveryTracking.pickupOtp,
        }
      : null;

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        deliveryTracking,
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
