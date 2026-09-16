import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        faculty: true,
      },
    });

    const halls = await prisma.hall.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
      },
    });

    return NextResponse.json({ departments, halls });
  } catch (error) {
    console.error("Failed to fetch departments/halls:", error);
    return NextResponse.json({ error: "Failed to load campus data" }, { status: 500 });
  }
}
