import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { studentRegisterSchema } from "@/lib/validations/auth";
import { hashPassword, signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { Role, StudentVerificationStatus, TokenType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Server-side strict validation
    const validationResult = studentRegisterSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      fullName,
      universityStudentId,
      departmentId,
      session,
      email,
      phone,
      password,
    } = validationResult.data;

    // 2. Check for duplicate email, phone, or universityStudentId
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: "An account with this email address already exists" },
          { status: 409 }
        );
      }
      if (existingUser.phone === phone) {
        return NextResponse.json(
          { error: "An account with this phone number already exists" },
          { status: 409 }
        );
      }
    }

    const existingStudentId = await prisma.student.findUnique({
      where: { universityStudentId },
    });
    if (existingStudentId) {
      return NextResponse.json(
        { error: "A student with this University ID is already registered" },
        { status: 409 }
      );
    }

    // 3. Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) {
      return NextResponse.json(
        { error: "Selected department is invalid" },
        { status: 400 }
      );
    }

    // 4. Hash password securely
    const passwordHash = await hashPassword(password);

    // 5. Create User & Student record with PENDING status (NEVER trust client role)
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash,
        role: Role.STUDENT, // Strictly forced on server
        isActive: true,
        isEmailVerified: false,
        student: {
          create: {
            universityStudentId,
            session,
            departmentId,
            verificationStatus: StudentVerificationStatus.PENDING, // Strictly PENDING
          },
        },
      },
      include: {
        student: true,
      },
    });

    // 6. Generate Email Verification Token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        userId: newUser.id,
        token: verificationToken,
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // 7. Create JWT Session
    const sessionToken = await signSessionToken({
      userId: newUser.id,
      phone: newUser.phone,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      isEmailVerified: false,
      studentId: newUser.student?.id,
      studentVerificationStatus: newUser.student?.verificationStatus,
    });

    const response = NextResponse.json(
      {
        success: true,
        message:
          "Your account has been created and is waiting for university verification.",
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
          verificationStatus: newUser.student?.verificationStatus,
        },
        verificationToken, // Provided in development for instant email testing
      },
      { status: 201 }
    );

    // Set HTTP-Only Cookie
    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Student registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
