import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { DeliveryType, PaymentMethod, PaymentStatus, OrderStatus, NotificationType } from "@prisma/client";

interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
}

interface CreateOrderBody {
  items: OrderItemInput[];
  destinationType: "EAT_HERE" | "TAKE_AWAY" | "CAFETERIA_PICKUP" | "HALL_DELIVERY" | "DEPARTMENT_DELIVERY";
  cafeteriaId: string;
  tableId?: string;
  hallId?: string;
  departmentId?: string;
  roomNumber?: string;
  landmark?: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
}

// Generate human-readable order number: COU-YYYYMMDD-XXXX
function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `COU-${dateStr}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to place an order." }, { status: 401 });
    }

    const body = (await req.json()) as CreateOrderBody;
    const {
      items,
      destinationType,
      cafeteriaId,
      tableId,
      hallId,
      departmentId,
      roomNumber,
      landmark,
      notes,
    } = body;

    // 1. Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty. Please add items before checking out." }, { status: 400 });
    }

    if (!destinationType) {
      return NextResponse.json({ error: "Please select a checkout destination." }, { status: 400 });
    }

    let targetCafeteriaId = cafeteriaId;

    // 2. Validate & Resolve Cafeteria (Self-healing against stale localStorage or mock slugs)
    let cafeteria = null;

    if (targetCafeteriaId) {
      cafeteria = await prisma.cafeteria.findUnique({
        where: { id: targetCafeteriaId },
        include: { tables: true },
      });

      if (!cafeteria) {
        cafeteria = await prisma.cafeteria.findFirst({
          where: {
            OR: [
              { slug: targetCafeteriaId },
              { slug: "central-cafeteria" },
              { name: { contains: targetCafeteriaId, mode: "insensitive" } },
            ],
          },
          include: { tables: true },
        });
      }
    }

    // Fallback: Check if items have a menuItem linked to an actual cafeteria
    if (!cafeteria && items.length > 0 && items[0].menuItemId) {
      const firstDbItem = await prisma.menuItem.findUnique({
        where: { id: items[0].menuItemId },
        include: { cafeteria: { include: { tables: true } } },
      });
      if (firstDbItem?.cafeteria) {
        cafeteria = firstDbItem.cafeteria;
      }
    }

    // Fallback: Pick the first open cafeteria, or any cafeteria in DB
    if (!cafeteria) {
      cafeteria =
        (await prisma.cafeteria.findFirst({
          where: { isOpen: true },
          include: { tables: true },
        })) ||
        (await prisma.cafeteria.findFirst({
          include: { tables: true },
        }));
    }

    if (!cafeteria) {
      return NextResponse.json({ error: "Selected cafeteria not found." }, { status: 404 });
    }

    targetCafeteriaId = cafeteria.id;

    if (!cafeteria.isOpen) {
      return NextResponse.json({ error: `Sorry, ${cafeteria.name} is currently closed.` }, { status: 400 });
    }

    // 3. Map Destination Type to DeliveryType enum and validate destination-specific fields
    let deliveryType: DeliveryType;
    let deliveryFee = 0;

    switch (destinationType) {
      case "EAT_HERE":
        deliveryType = DeliveryType.TABLE_QR;
        deliveryFee = 0;
        if (tableId) {
          const tableExists = cafeteria.tables.some((t) => t.id === tableId);
          if (!tableExists) {
            return NextResponse.json({ error: "Selected dining table is invalid for this cafeteria." }, { status: 400 });
          }
        }
        break;

      case "TAKE_AWAY":
      case "CAFETERIA_PICKUP":
        deliveryType = DeliveryType.CAFETERIA_PICKUP;
        deliveryFee = 0;
        break;

      case "HALL_DELIVERY":
        deliveryType = DeliveryType.HALL_DELIVERY;
        deliveryFee = 15; // Standard campus hall delivery fee (৳15)
        if (!hallId) {
          return NextResponse.json({ error: "Please select a residential hall for delivery." }, { status: 400 });
        }
        if (!roomNumber?.trim()) {
          return NextResponse.json({ error: "Please provide your room or floor number for hall delivery." }, { status: 400 });
        }
        break;

      case "DEPARTMENT_DELIVERY":
        deliveryType = DeliveryType.DEPARTMENT_DELIVERY;
        deliveryFee = 10; // Academic building delivery fee (৳10)
        if (!departmentId) {
          return NextResponse.json({ error: "Please select an academic department or building." }, { status: 400 });
        }
        if (!roomNumber?.trim()) {
          return NextResponse.json({ error: "Please specify room, lab, or floor number for department delivery." }, { status: 400 });
        }
        break;

      default:
        return NextResponse.json({ error: "Invalid destination type selected." }, { status: 400 });
    }

    // 4. Server-side validation of all menu items & stock verification
    const itemIds = items.map((i) => i.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
      include: {
        inventory: true,
      },
    });

    if (dbMenuItems.length !== items.length) {
      return NextResponse.json({ error: "One or more items in your cart could not be found." }, { status: 404 });
    }

    let calculatedSubtotal = 0;
    let calculatedDiscount = 0;
    const validatedOrderItems: {
      menuItemId: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      specialInstructions?: string;
    }[] = [];

    for (const inputItem of items) {
      const dbItem = dbMenuItems.find((m) => m.id === inputItem.menuItemId);
      if (!dbItem) {
        return NextResponse.json({ error: "Item not found in menu." }, { status: 400 });
      }

      // Check availability
      if (!dbItem.isAvailable) {
        return NextResponse.json(
          { error: `"${dbItem.name}" is currently unavailable.` },
          { status: 400 }
        );
      }

      // Check stock
      if (dbItem.inventory) {
        if (dbItem.inventory.isSoldOut || dbItem.inventory.currentStock < inputItem.quantity) {
          return NextResponse.json(
            {
              error: `"${dbItem.name}" is SOLD OUT or has insufficient stock (${dbItem.inventory.currentStock} left).`,
            },
            { status: 400 }
          );
        }
      }

      const originalPrice = parseFloat(dbItem.price.toString());
      const effectivePrice = dbItem.discountPrice
        ? parseFloat(dbItem.discountPrice.toString())
        : originalPrice;

      const lineTotal = effectivePrice * inputItem.quantity;
      const lineDiscount = (originalPrice - effectivePrice) * inputItem.quantity;

      calculatedSubtotal += lineTotal;
      calculatedDiscount += lineDiscount;

      validatedOrderItems.push({
        menuItemId: dbItem.id,
        quantity: inputItem.quantity,
        unitPrice: effectivePrice,
        totalPrice: lineTotal,
        specialInstructions: inputItem.specialInstructions?.trim() || undefined,
      });
    }

    const calculatedTotalAmount = calculatedSubtotal + deliveryFee;

    // 5. Execute Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 5.1 Create Delivery Location if Hall or Department Delivery
      let deliveryLocationId: string | undefined = undefined;

      if (deliveryType === DeliveryType.HALL_DELIVERY) {
        const hall = await tx.hall.findUnique({ where: { id: hallId } });
        const locationRecord = await tx.deliveryLocation.create({
          data: {
            name: `${hall?.name || "Hall"} - Room ${roomNumber}`,
            hallId,
            roomNumber: roomNumber?.trim(),
            landmark: landmark?.trim() || null,
          },
        });
        deliveryLocationId = locationRecord.id;
      } else if (deliveryType === DeliveryType.DEPARTMENT_DELIVERY) {
        const dept = await tx.department.findUnique({ where: { id: departmentId } });
        const locationRecord = await tx.deliveryLocation.create({
          data: {
            name: `${dept?.name || "Dept"} - Room ${roomNumber}`,
            departmentId,
            roomNumber: roomNumber?.trim(),
            landmark: landmark?.trim() || null,
          },
        });
        deliveryLocationId = locationRecord.id;
      }

      // 5.2 Create the Order
      const orderNumber = generateOrderNumber();
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: user.userId,
          cafeteriaId: targetCafeteriaId,
          deliveryType,
          status: OrderStatus.PENDING,
          subtotal: calculatedSubtotal,
          deliveryFee,
          discount: calculatedDiscount,
          totalAmount: calculatedTotalAmount,
          notes: notes?.trim() || null,
          tableId: destinationType === "EAT_HERE" ? tableId || null : null,
          deliveryLocationId,
        },
      });

      // 5.3 Create OrderItems and Deduct Inventory
      for (const item of validatedOrderItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            specialInstructions: item.specialInstructions,
          },
        });

        // Deduct inventory
        const inv = await tx.inventory.findUnique({
          where: { menuItemId: item.menuItemId },
        });

        if (inv) {
          const nextStock = Math.max(0, inv.currentStock - item.quantity);
          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              currentStock: nextStock,
              isSoldOut: nextStock === 0,
            },
          });
        }
      }

      // 5.4 Create Payment record according to selected method
      const selectedMethod = (body.paymentMethod && Object.values(PaymentMethod).includes(body.paymentMethod))
        ? body.paymentMethod
        : PaymentMethod.CASH_ON_DELIVERY;

      const isDemo = selectedMethod !== PaymentMethod.CASH_ON_DELIVERY;
      const initialPaymentStatus = isDemo ? PaymentStatus.PROCESSING : PaymentStatus.PENDING;
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const receiptNumber = `REC-${dateStr}-${randomSuffix}`;
      const gatewayRef = `${selectedMethod}-${Date.now()}`;

      const createdPayment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: calculatedTotalAmount,
          method: selectedMethod,
          status: initialPaymentStatus,
          isDemo,
          receiptNumber,
          gatewayRef,
        },
      });

      // 5.5 Create DeliveryTracking if delivery requested
      if (
        deliveryType === DeliveryType.HALL_DELIVERY ||
        deliveryType === DeliveryType.DEPARTMENT_DELIVERY
      ) {
        await tx.deliveryTracking.create({
          data: {
            orderId: order.id,
            estimatedDeliveryTime: new Date(Date.now() + 35 * 60 * 1000), // ~35 mins
          },
        });
      }

      // 5.6 Create in-app Notification for student
      await tx.notification.create({
        data: {
          userId: user.userId,
          type: NotificationType.ORDER_CONFIRMED,
          title: "Order Confirmed!",
          body: `Your order #${orderNumber} for ৳${calculatedTotalAmount.toFixed(0)} has been placed at ${cafeteria.name}. Payment method: ${selectedMethod}${isDemo ? " (Demo Payment)" : ""}.`,
          actionUrl: `/orders/${order.id}`,
        },
      });

      return {
        order,
        payment: createdPayment,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Order placed successfully!",
      orderId: result.order.id,
      orderNumber: result.order.orderNumber,
      totalAmount: calculatedTotalAmount,
      payment: {
        id: result.payment.id,
        method: result.payment.method,
        status: result.payment.status,
        isDemo: result.payment.isDemo,
        receiptNumber: result.payment.receiptNumber,
      },
    });
  } catch (error) {
    console.error("[Create Order API] Error:", error);
    return NextResponse.json(
      { error: "Failed to place order. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.userId },
      include: {
        cafeteria: { select: { name: true } },
        orderItems: {
          include: {
            menuItem: { select: { name: true, imageUrl: true } },
          },
        },
        payment: { select: { status: true, method: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("[Get Orders API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
