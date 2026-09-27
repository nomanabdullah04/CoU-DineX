import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CLASS_PREORDER_CONFIG } from "@/lib/innovation-config";

// Day name helper
function getTodayDayName(): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}

// Convert "HH:MM" to decimal hours (e.g. "11:30" -> 11.5)
function timeStringToDecimal(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

export async function GET(req: NextRequest) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find student profile
    const student = await prisma.student.findUnique({
      where: { userId: userSession.userId },
      include: {
        classSchedules: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const today = getTodayDayName();
    const now = new Date();
    const currentDecimal = now.getHours() + now.getMinutes() / 60;

    // Filter today's classes
    const todayClasses = student.classSchedules.filter(
      (c) => c.dayOfWeek.toLowerCase() === today.toLowerCase()
    );

    let smartRecommendation: {
      type: "BEFORE_CLASS" | "AFTER_CLASS" | "GENERAL";
      message: string;
      targetClass?: any;
      suggestedPickupTime?: string;
    } = {
      type: "GENERAL",
      message: "No immediate classes found today. Enjoy a relaxed meal at Central Cafeteria!",
    };

    // Check upcoming or ongoing classes
    for (const cls of todayClasses) {
      const startDec = timeStringToDecimal(cls.startTime);
      const endDec = timeStringToDecimal(cls.endTime);

      // 1. If currently inside class, recommend ready right after class
      if (currentDecimal >= startDec && currentDecimal < endDec) {
        smartRecommendation = {
          type: "AFTER_CLASS",
          message: `Your food can be ready right after ${cls.courseCode} class at ${cls.endTime}!`,
          targetClass: cls,
          suggestedPickupTime: cls.endTime,
        };
        break;
      }

      // 2. If upcoming class within 45 minutes, recommend ordering before class
      const minutesUntilStart = Math.round((startDec - currentDecimal) * 60);
      if (minutesUntilStart > 0 && minutesUntilStart <= 50) {
        smartRecommendation = {
          type: "BEFORE_CLASS",
          message: `Order before your ${cls.courseCode} class starts at ${cls.startTime} (in ~${minutesUntilStart} min).`,
          targetClass: cls,
          suggestedPickupTime: cls.startTime,
        };
        break;
      }
    }

    return NextResponse.json({
      success: true,
      today,
      schedules: student.classSchedules,
      todayClasses,
      smartRecommendation,
    });
  } catch (error: any) {
    console.error("Fetch class schedule failed:", error);
    return NextResponse.json({ error: "Failed to load class schedule" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: userSession.userId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile required" }, { status: 404 });
    }

    const body = await req.json();
    const { courseName, dayOfWeek, startTime, endTime, classroom, room, building } = body;
    const finalCourseCode = (body.courseCode || courseName?.split(" ")[0] || "COURSE").trim().toUpperCase();
    const finalCourseName = courseName ? courseName.trim() : finalCourseCode;
    const finalClassroom = classroom ? classroom.trim() : room ? room.trim() : null;

    if (!finalCourseCode || !startTime || !endTime || !dayOfWeek) {
      return NextResponse.json(
        { error: "Course code/name, day of week, start time, and end time are required." },
        { status: 400 }
      );
    }

    const newSchedule = await prisma.classSchedule.create({
      data: {
        studentId: student.id,
        courseCode: finalCourseCode,
        courseName: finalCourseName,
        dayOfWeek: dayOfWeek.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        classroom: finalClassroom,
        building: building ? building.trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Class schedule added successfully",
      schedule: newSchedule,
    });
  } catch (error: any) {
    console.error("Add class schedule failed:", error);
    return NextResponse.json({ error: "Failed to save schedule" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scheduleId = searchParams.get("id");

    if (!scheduleId) {
      return NextResponse.json({ error: "Schedule id is required" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: userSession.userId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    await prisma.classSchedule.deleteMany({
      where: {
        id: scheduleId,
        studentId: student.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Schedule entry removed",
    });
  } catch (error: any) {
    console.error("Delete class schedule failed:", error);
    return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
  }
}
