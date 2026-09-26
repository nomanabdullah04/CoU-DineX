import { prisma } from "@/lib/prisma";
import { DigitalReceiptData, ReceiptItem } from "./types";
import { PAYMENT_METHOD_CONFIGS } from "./types";

export async function getDigitalReceipt(orderId: string): Promise<DigitalReceiptData | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          role: true,
        },
      },
      cafeteria: {
        select: {
          name: true,
        },
      },
      orderItems: {
        include: {
          menuItem: {
            select: {
              name: true,
            },
          },
        },
      },
      table: {
        select: {
          tableNumber: true,
        },
      },
      deliveryLocation: {
        include: {
          hall: { select: { name: true } },
          department: { select: { name: true } },
        },
      },
      payment: true,
    },
  });

  if (!order) {
    return null;
  }

  // Format destination display
  let destinationDisplay = "Cafeteria Takeaway (Counter Pickup)";
  if (order.deliveryType === "TABLE_QR") {
    destinationDisplay = `Dine In — Table #${order.table?.tableNumber || "Dining Table"}`;
  } else if (order.deliveryType === "HALL_DELIVERY") {
    destinationDisplay = `Hall Delivery: ${order.deliveryLocation?.hall?.name || "Hall"} — Room ${order.deliveryLocation?.roomNumber || "N/A"}`;
  } else if (order.deliveryType === "DEPARTMENT_DELIVERY") {
    destinationDisplay = `Department Delivery: ${order.deliveryLocation?.department?.name || "Dept"} — Room ${order.deliveryLocation?.roomNumber || "N/A"}`;
  }

  const items: ReceiptItem[] = order.orderItems.map((item) => ({
    id: item.id,
    name: item.menuItem.name,
    quantity: item.quantity,
    unitPrice: parseFloat(item.unitPrice.toString()),
    totalPrice: parseFloat(item.totalPrice.toString()),
    specialInstructions: item.specialInstructions,
  }));

  const payment = order.payment;
  const paymentMethodRaw = payment?.method || "CASH_ON_DELIVERY";
  const config = PAYMENT_METHOD_CONFIGS[paymentMethodRaw];
  const isDemo = payment?.isDemo ?? (config?.isDemo || false);

  // Generate fallback receipt number if not present yet
  const receiptNumber = payment?.receiptNumber || `REC-${order.createdAt.toISOString().slice(0, 10).replace(/-/g, "")}-${order.orderNumber.replace(/[^0-9]/g, "").padStart(5, "0")}`;

  return {
    receiptNumber,
    appName: "CoU DineX",
    campusName: "Comilla University",
    orderId: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    paidAt: payment?.paidAt ? payment.paidAt.toISOString() : null,
    customerName: order.user.fullName,
    customerPhone: order.user.phone,
    customerEmail: order.user.email,
    customerRole: order.user.role,
    cafeteriaName: order.cafeteria.name,
    deliveryType: order.deliveryType,
    destinationDisplay,
    items,
    subtotal: parseFloat(order.subtotal.toString()),
    discount: parseFloat(order.discount.toString()),
    deliveryFee: parseFloat(order.deliveryFee.toString()),
    totalAmount: parseFloat(order.totalAmount.toString()),
    paymentMethod: isDemo ? `${config?.name || paymentMethodRaw} (Demo Payment)` : (config?.name || "Cash"),
    paymentMethodRaw,
    paymentStatus: payment?.status || "PENDING",
    transactionId: payment?.transactionId || null,
    isDemo,
    demoNotice: isDemo
      ? "Demo Payment — Simulated payment for campus system evaluation. No real currency transferred."
      : null,
  };
}
