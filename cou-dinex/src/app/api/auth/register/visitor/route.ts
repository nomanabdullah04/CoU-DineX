import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { visitorRegisterSchema } from "@/lib/validations/auth";
import { hashPassword, signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { Role, TokenType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Server-side validation
    const validationResult = visitorRegisterSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { fullName, email, phone, password } = validationResult.data;

    // 2. Check for duplicate email or phone
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

    // 3. Hash password securely
    const passwordHash = await hashPassword(password);

    // 4. Create User & Visitor record (strictly forcing Role.VISITOR)
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash,
        role: Role.VISITOR, // Strictly forced on server
        isActive: true,
        isEmailVerified: false,
        visitor: {
          create: {
            purpose: "Campus Dining & Guest",
          },
        },
      },
      include: {
        visitor: true,
      },
    });

    // 5. Generate Email Verification Token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        userId: newUser.id,
        token: verificationToken,
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // 6. Create JWT Session
    const sessionToken = await signSessionToken({
      userId: newUser.id,
      phone: newUser.phone,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      isEmailVerified: false,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Visitor account created successfully. Welcome to CoU DineX!",
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
        },
        verificationToken,
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
    console.error("Visitor registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
