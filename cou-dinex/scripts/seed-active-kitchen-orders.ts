import { prisma } from "../src/lib/prisma";
import { OrderStatus, DeliveryType, PaymentStatus, DeliveryStatus } from "@prisma/client";

async function main() {
  console.log("🌱 Creating Sample Active Kitchen Orders for Visual Polish...");

  const student = await prisma.user.findFirst({ where: { role: "STUDENT" } });
  const cafeteria = await prisma.cafeteria.findFirst({
    include: { menuItems: true, tables: true },
  });
  const hall = await prisma.hall.findFirst();
  const dept = await prisma.department.findFirst({ where: { code: "CSE" } });

  if (!student || !cafeteria || cafeteria.menuItems.length === 0) {
    console.error("Missing data");
    return;
  }

  const items = cafeteria.menuItems;

  // 1. New Order (Eat Here, Table #T-02)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: `COU-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: student.id,
      cafeteriaId: cafeteria.id,
      deliveryType: DeliveryType.TABLE_QR,
      tableId: cafeteria.tables[0]?.id,
      status: OrderStatus.PENDING,
      subtotal: 240,
      deliveryFee: 0,
      discount: 0,
      totalAmount: 240,
      notes: "Please provide extra spoons",
      orderItems: {
        create: [
          {
            menuItemId: items[0].id,
            quantity: 2,
            unitPrice: 120,
            totalPrice: 240,
            specialInstructions: "Less spicy please",
          },
        ],
      },
      payment: {
        create: {
          amount: 240,
          method: "CASH_ON_DELIVERY",
          status: PaymentStatus.PENDING,
        },
      },
    },
  });

  // 2. Confirmed Order (Take Away)
  const order2 = await prisma.order.create({
    data: {
      orderNumber: `COU-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: student.id,
      cafeteriaId: cafeteria.id,
      deliveryType: DeliveryType.CAFETERIA_PICKUP,
      status: OrderStatus.CONFIRMED,
      subtotal: 75,
      deliveryFee: 0,
      discount: 0,
      totalAmount: 75,
      orderItems: {
        create: [
          {
            menuItemId: items[1]?.id || items[0].id,
            quantity: 3,
            unitPrice: 25,
            totalPrice: 75,
            specialInstructions: "Pack separately in paper bag",
          },
        ],
      },
      payment: {
        create: {
          amount: 75,
          method: "CASH_ON_DELIVERY",
          status: PaymentStatus.PENDING,
        },
      },
    },
  });

  // 3. Preparing Order (Hall Delivery)
  const locHall = await prisma.deliveryLocation.create({
    data: {
      name: `${hall?.name || "Kazi Nazrul Islam Hall"} - Room 204`,
      hallId: hall?.id,
      roomNumber: "204",
      landmark: "East Wing 2nd Floor",
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: `COU-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: student.id,
      cafeteriaId: cafeteria.id,
      deliveryType: DeliveryType.HALL_DELIVERY,
      deliveryLocationId: locHall.id,
      status: OrderStatus.PREPARING,
      subtotal: 180,
      deliveryFee: 15,
      discount: 0,
      totalAmount: 195,
      notes: "Call when rider leaves",
      orderItems: {
        create: [
          {
            menuItemId: items[2]?.id || items[0].id,
            quantity: 1,
            unitPrice: 180,
            totalPrice: 180,
            specialInstructions: "Mustard gravy should be hot",
          },
        ],
      },
      payment: {
        create: {
          amount: 195,
          method: "CASH_ON_DELIVERY",
          status: PaymentStatus.PENDING,
        },
      },
    },
  });

  // 4. Ready Order (Department Delivery)
  const locDept = await prisma.deliveryLocation.create({
    data: {
      name: `Faculty of Science - ${dept?.code || "CSE"} Lab 2`,
      departmentId: dept?.id,
      roomNumber: "Lab 201",
      landmark: "Next to Network Lab",
    },
  });

  const order4 = await prisma.order.create({
    data: {
      orderNumber: `COU-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: student.id,
      cafeteriaId: cafeteria.id,
      deliveryType: DeliveryType.DEPARTMENT_DELIVERY,
      deliveryLocationId: locDept.id,
      status: OrderStatus.READY_FOR_PICKUP,
      subtotal: 90,
      deliveryFee: 10,
      discount: 0,
      totalAmount: 100,
      orderItems: {
        create: [
          {
            menuItemId: items[3]?.id || items[0].id,
            quantity: 2,
            unitPrice: 45,
            totalPrice: 90,
          },
        ],
      },
      payment: {
        create: {
          amount: 100,
          method: "CASH_ON_DELIVERY",
          status: PaymentStatus.PENDING,
        },
      },
    },
  });

  console.log("✅ Seeded 4 active orders across New, Confirmed, Preparing, and Ready!");
  console.log(`- New Order: #${order1.orderNumber}`);
  console.log(`- Confirmed Order: #${order2.orderNumber}`);
  console.log(`- Preparing Order: #${order3.orderNumber}`);
  console.log(`- Ready Order: #${order4.orderNumber}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
