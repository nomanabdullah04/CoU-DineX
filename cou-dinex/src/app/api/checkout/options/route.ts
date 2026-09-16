import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [cafeterias, halls, departments] = await Promise.all([
      prisma.cafeteria.findMany({
        where: { isOpen: true },
        select: {
          id: true,
          name: true,
          slug: true,
          location: true,
          isOpen: true,
          tables: {
            select: {
              id: true,
              tableNumber: true,
              capacity: true,
              isOccupied: true,
            },
            orderBy: { tableNumber: "asc" },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.hall.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          type: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.department.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          faculty: true,
          building: true,
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      cafeterias,
      halls,
      departments,
    });
  } catch (error) {
    console.error("[Checkout Options API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch checkout destination options" },
      { status: 500 }
    );
  }
}
