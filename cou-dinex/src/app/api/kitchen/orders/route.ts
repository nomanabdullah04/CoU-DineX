import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OrderStatus, DeliveryType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role-based access control: Kitchen staff or Admin ONLY
    const isKitchenAuthorized =
      user.role === "CAFETERIA_STAFF" ||
      user.role === "CAFETERIA_ADMIN" ||
      user.role === "SUPER_ADMIN";

    if (!isKitchenAuthorized) {
      return NextResponse.json(
        { error: "Forbidden. Kitchen staff authorization required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const cafeteriaId = searchParams.get("cafeteriaId");

    // Fetch active kitchen orders + recently completed orders
    const whereClause: any = {
      status: {
        in: [
          OrderStatus.PENDING,
          OrderStatus.CONFIRMED,
          OrderStatus.PREPARING,
          OrderStatus.READY_FOR_PICKUP,
          OrderStatus.DELIVERED,
        ],
      },
    };

    if (cafeteriaId) {
      whereClause.cafeteriaId = cafeteriaId;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
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
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
            student: {
              select: {
                universityStudentId: true,
                department: { select: { code: true } },
              },
            },
          },
        },
        cafeteria: {
          select: {
            id: true,
            name: true,
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
      },
      orderBy: { createdAt: "asc" },
    });

    const now = Date.now();

    // Split into in-flight vs completed
    const activeStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
    ];

    const activeOrdersList = orders.filter((o) => activeStatuses.includes(o.status));
    const completedOrdersList = orders
      .filter((o) => o.status === OrderStatus.DELIVERED)
      .slice(-20) // last 20 completed
      .reverse();

    // Map order with Smart Queue information
    const formatOrder = (order: (typeof orders)[0], queueIndex: number | null) => {
      const elapsedSeconds = Math.max(0, Math.floor((now - new Date(order.createdAt).getTime()) / 1000));
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      const remainingSecs = elapsedSeconds % 60;
      const waitingTimeFormatted = `${elapsedMinutes}m ${remainingSecs < 10 ? "0" : ""}${remainingSecs}s`;

      // Calculate estimated prep time from items
      const prepTimes = order.orderItems.map(
        (i) => i.menuItem.preparationTimeMinutes || 10
      );
      const estimatedPrepTimeMinutes = prepTimes.length > 0 ? Math.max(...prepTimes) : 12;

      // Determine human readable destination
      let destinationTitle = "Take Away";
      let destinationDetail = "Counter Pickup";

      if (order.deliveryType === DeliveryType.TABLE_QR) {
        destinationTitle = "Eat Here";
        destinationDetail = order.table ? `Table #${order.table.tableNumber}` : "Dine In Table";
      } else if (order.deliveryType === DeliveryType.HALL_DELIVERY) {
        destinationTitle = "Hall Delivery";
        const hallName = order.deliveryLocation?.hall?.name || "Residential Hall";
        const room = order.deliveryLocation?.roomNumber ? `Room ${order.deliveryLocation.roomNumber}` : "";
        destinationDetail = [hallName, room].filter(Boolean).join(" • ");
      } else if (order.deliveryType === DeliveryType.DEPARTMENT_DELIVERY) {
        destinationTitle = "Department Delivery";
        const dept = order.deliveryLocation?.department?.code || "Academic Dept";
        const room = order.deliveryLocation?.roomNumber ? `Room ${order.deliveryLocation.roomNumber}` : "";
        destinationDetail = [dept, room].filter(Boolean).join(" • ");
      } else if (order.deliveryType === DeliveryType.CAFETERIA_PICKUP) {
        destinationTitle = "Take Away";
        destinationDetail = "Quick Counter Pickup";
      }

      // Format items
      const items = order.orderItems.map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.menuItem.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        specialInstructions: item.specialInstructions || null,
      }));

      const totalItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        notes: order.notes,
        totalAmount: Number(order.totalAmount),
        customer: {
          name: order.user.fullName,
          phone: order.user.phone,
          studentId: order.user.student?.universityStudentId || null,
          department: order.user.student?.department?.code || null,
        },
        destination: {
          type: order.deliveryType,
          title: destinationTitle,
          detail: destinationDetail,
          landmark: order.deliveryLocation?.landmark || null,
        },
        smartQueue: {
          queuePosition: queueIndex !== null ? `#${queueIndex + 1}` : null,
          queueRank: queueIndex !== null ? queueIndex + 1 : null,
          waitingTimeSeconds: elapsedSeconds,
          waitingTimeFormatted,
          isDelayed: elapsedMinutes > 15,
          estimatedPrepTimeMinutes,
        },
        items,
        totalItemCount,
      };
    };

    // Grouping by stage
    const newOrders = activeOrdersList
      .filter((o) => o.status === OrderStatus.PENDING)
      .map((o, idx) => formatOrder(o, idx));

    const confirmed = activeOrdersList
      .filter((o) => o.status === OrderStatus.CONFIRMED)
      .map((o, idx) => formatOrder(o, newOrders.length + idx));

    const preparing = activeOrdersList
      .filter((o) => o.status === OrderStatus.PREPARING)
      .map((o, idx) => formatOrder(o, newOrders.length + confirmed.length + idx));

    const ready = activeOrdersList
      .filter((o) => o.status === OrderStatus.READY_FOR_PICKUP)
      .map((o) => formatOrder(o, null));

    const completed = completedOrdersList.map((o) => formatOrder(o, null));

    const totalActive = activeOrdersList.length;
    const avgWaitMinutes =
      activeOrdersList.length > 0
        ? Math.round(
            activeOrdersList.reduce((acc, o) => {
              const diffMs = now - new Date(o.createdAt).getTime();
              return acc + diffMs / 60000;
            }, 0) / activeOrdersList.length
          )
        : 0;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      staff: {
        id: user.userId,
        name: user.fullName,
        role: user.role,
      },
      counts: {
        totalActive,
        new: newOrders.length,
        confirmed: confirmed.length,
        preparing: preparing.length,
        ready: ready.length,
        completed: completed.length,
      },
      telemetry: {
        avgWaitMinutes,
        longestWaitMinutes:
          activeOrdersList.length > 0
            ? Math.round((now - new Date(activeOrdersList[0].createdAt).getTime()) / 60000)
            : 0,
      },
      orders: {
        newOrders,
        confirmed,
        preparing,
        ready,
        completed,
      },
    });
  } catch (error) {
    console.error("[KDS Orders API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch kitchen orders." },
      { status: 500 }
    );
  }
}
