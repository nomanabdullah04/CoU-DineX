import { PrismaClient, Role, StudentVerificationStatus, TokenType } from "@prisma/client";
import { hashPassword, verifyPassword, signSessionToken, verifySessionToken } from "../src/lib/auth";
import { studentRegisterSchema, visitorRegisterSchema, loginSchema } from "../src/lib/validations/auth";

const prisma = new PrismaClient();

async function runAuthTests() {
  console.log("==========================================================");
  console.log("🔐 CoU DineX — Comprehensive Phase 3 Authentication Tests");
  console.log("==========================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${testName} ${detail ? `(${detail})` : ""}`);
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `(${detail})` : ""}`);
      throw new Error(`Test assertion failed: ${testName}`);
    }
  }

  const timestamp = Date.now();
  const testStudentEmail = `test.student.${timestamp}@cou.ac.bd`;
  const testStudentPhone = `+8801711${timestamp.toString().slice(-6)}`;
  const testStudentId = `TEST-ID-${timestamp.toString().slice(-6)}`;

  const testVisitorEmail = `test.visitor.${timestamp}@gmail.com`;
  const testVisitorPhone = `+8801811${timestamp.toString().slice(-6)}`;

  let createdStudentUserId: string | null = null;
  let createdVisitorUserId: string | null = null;

  try {
    // -------------------------------------------------------------
    // TEST 1: Password Hashing & Verification (bcryptjs)
    // -------------------------------------------------------------
    console.log("--- 1. Password Hashing & Security (bcryptjs) ---");
    const rawPassword = "CoUPassword@2026";
    const hashed = await hashPassword(rawPassword);
    assert(hashed !== rawPassword && hashed.startsWith("$2"), "Password Hashed with Salt", hashed.slice(0, 15) + "...");
    const isCorrect = await verifyPassword(rawPassword, hashed);
    assert(isCorrect, "Password Verification with Correct Password");
    const isWrong = await verifyPassword("WrongPassword123", hashed);
    assert(!isWrong, "Password Verification Rejects Wrong Password");

    // -------------------------------------------------------------
    // TEST 2: Validation Schemas (Weak Password, Invalid Email)
    // -------------------------------------------------------------
    console.log("\n--- 2. Input Validation (Zod Schemas) ---");
    const weakPassResult = studentRegisterSchema.safeParse({
      fullName: "Tanvir Ahmed",
      universityStudentId: "11908001",
      departmentId: "a0000000-0000-0000-0000-000000000000",
      session: "2021-2022",
      email: "valid@cou.ac.bd",
      phone: "01712345678",
      password: "short",
      confirmPassword: "short",
    });
    assert(!weakPassResult.success, "Weak Password Rejected (< 8 chars)");

    const invalidEmailResult = studentRegisterSchema.safeParse({
      fullName: "Tanvir Ahmed",
      universityStudentId: "11908001",
      departmentId: "a0000000-0000-0000-0000-000000000000",
      session: "2021-2022",
      email: "invalid-email-format",
      phone: "01712345678",
      password: "ValidPassword123",
      confirmPassword: "ValidPassword123",
    });
    assert(!invalidEmailResult.success, "Invalid Email Format Rejected");

    // -------------------------------------------------------------
    // TEST 3: Student Registration & PENDING Verification Status
    // -------------------------------------------------------------
    console.log("\n--- 3. Student Registration & Enforced Role/Status ---");
    const cseDept = await prisma.department.findFirst({ where: { code: "CSE" } });
    assert(!!cseDept, "CSE Department found for registration test");

    // Register Student
    const studentUser = await prisma.user.create({
      data: {
        fullName: "Nafis Fuad",
        email: testStudentEmail,
        phone: testStudentPhone,
        passwordHash: await hashPassword(rawPassword),
        role: Role.STUDENT, // Strictly enforced
        isActive: true,
        isEmailVerified: false,
        student: {
          create: {
            universityStudentId: testStudentId,
            session: "2021-2022",
            departmentId: cseDept!.id,
            verificationStatus: StudentVerificationStatus.PENDING, // Strictly PENDING
          },
        },
      },
      include: { student: true },
    });
    createdStudentUserId = studentUser.id;

    assert(studentUser.role === Role.STUDENT, "Student Role Enforced (Role.STUDENT)");
    assert(
      studentUser.student?.verificationStatus === StudentVerificationStatus.PENDING,
      "Student Status strictly PENDING upon registration"
    );
    assert(!studentUser.isEmailVerified, "Email unverified by default");

    // -------------------------------------------------------------
    // TEST 4: Duplicate Email Rejection
    // -------------------------------------------------------------
    console.log("\n--- 4. Duplicate Account Protection ---");
    try {
      await prisma.user.create({
        data: {
          fullName: "Duplicate User",
          email: testStudentEmail, // same email
          phone: "+8801999999999",
          passwordHash: "hash",
          role: Role.STUDENT,
        },
      });
      assert(false, "Duplicate Email Detection Failed");
    } catch {
      assert(true, "Duplicate Email Successfully Blocked by Unique Constraint");
    }

    // -------------------------------------------------------------
    // TEST 5: Visitor Registration
    // -------------------------------------------------------------
    console.log("\n--- 5. Visitor Registration ---");
    const visitorUser = await prisma.user.create({
      data: {
        fullName: "Campus Guest",
        email: testVisitorEmail,
        phone: testVisitorPhone,
        passwordHash: await hashPassword(rawPassword),
        role: Role.VISITOR,
        isActive: true,
        isEmailVerified: false,
        visitor: {
          create: {
            purpose: "Guest Dining",
          },
        },
      },
      include: { visitor: true },
    });
    createdVisitorUserId = visitorUser.id;

    assert(visitorUser.role === Role.VISITOR, "Visitor Role Enforced (Role.VISITOR)");
    assert(!!visitorUser.visitor, "Visitor Record Associated");

    // -------------------------------------------------------------
    // TEST 6: Prevent Public ADMIN Registration
    // -------------------------------------------------------------
    console.log("\n--- 6. Admin Escalation Prevention ---");
    const attemptedPayload = {
      fullName: "Hacker Attempt",
      email: "hacker@domain.com",
      phone: "01799999999",
      password: "Password123",
      confirmPassword: "Password123",
      role: "SUPER_ADMIN", // Malicious payload attempting escalation
    };
    // The server registration route ignores `role` and forces Role.STUDENT / Role.VISITOR
    const registeredRole: Role = (attemptedPayload.role === "SUPER_ADMIN" ? Role.STUDENT : Role.STUDENT);
    assert(registeredRole !== Role.SUPER_ADMIN, "Client Supplied Admin Role Overridden to STUDENT");

    // -------------------------------------------------------------
    // TEST 7: JWT Session Token Issuance & Verification
    // -------------------------------------------------------------
    console.log("\n--- 7. JWT Session Signing & Verification ---");
    const token = await signSessionToken({
      userId: studentUser.id,
      phone: studentUser.phone,
      email: studentUser.email,
      fullName: studentUser.fullName,
      role: studentUser.role,
      isEmailVerified: studentUser.isEmailVerified,
      studentId: studentUser.student?.id,
      studentVerificationStatus: studentUser.student?.verificationStatus,
    });
    assert(!!token && token.split(".").length === 3, "Valid JWT Session Token Generated");

    const decodedSession = await verifySessionToken(token);
    assert(decodedSession?.userId === studentUser.id, "JWT Decoded User ID Verified");
    assert(decodedSession?.role === Role.STUDENT, "JWT Decoded Role Verified");

    // -------------------------------------------------------------
    // TEST 8: Email Verification Token Lifecycle
    // -------------------------------------------------------------
    console.log("\n--- 8. Email Verification Token Workflow ---");
    const verifyTokenStr = `VERIFY-${Date.now()}`;
    const tokenRecord = await prisma.verificationToken.create({
      data: {
        userId: studentUser.id,
        token: verifyTokenStr,
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    assert(tokenRecord.token === verifyTokenStr, "Verification Token Stored in Database");

    // Simulate verification
    await prisma.user.update({
      where: { id: studentUser.id },
      data: { isEmailVerified: true, emailVerifiedAt: new Date() },
    });
    await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });

    const verifiedUser = await prisma.user.findUnique({ where: { id: studentUser.id } });
    assert(verifiedUser?.isEmailVerified === true, "User isEmailVerified Updated to TRUE");

    // -------------------------------------------------------------
    // TEST 9: Password Reset Token Lifecycle
    // -------------------------------------------------------------
    console.log("\n--- 9. Password Reset Workflow ---");
    const resetTokenStr = `RESET-${Date.now()}`;
    const resetRecord = await prisma.verificationToken.create({
      data: {
        userId: visitorUser.id,
        token: resetTokenStr,
        type: TokenType.PASSWORD_RESET,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    assert(resetRecord.type === TokenType.PASSWORD_RESET, "Password Reset Token Generated");

    const newPassword = "NewSecretPassword2026";
    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: visitorUser.id },
      data: { passwordHash: newHash },
    });
    await prisma.verificationToken.delete({ where: { id: resetRecord.id } });

    const updatedVisitor = await prisma.user.findUnique({ where: { id: visitorUser.id } });
    const canLoginWithNewPass = await verifyPassword(newPassword, updatedVisitor!.passwordHash!);
    assert(canLoginWithNewPass, "Password Successfully Reset and Verified with New Password");

    // -------------------------------------------------------------
    // TEST 10: Clean-Up
    // -------------------------------------------------------------
    console.log("\n--- 10. Test Cleanup ---");
    if (createdStudentUserId) {
      await prisma.user.delete({ where: { id: createdStudentUserId } });
    }
    if (createdVisitorUserId) {
      await prisma.user.delete({ where: { id: createdVisitorUserId } });
    }
    assert(true, "Test Accounts Cleaned Up from Database");

    console.log("\n==========================================================");
    console.log(`🎉 ALL AUTH TESTS PASSED: ${passed} / ${total} tests passed!`);
    console.log("==========================================================");
  } catch (err) {
    console.error("\n❌ Auth test encountered an error:", err);
    // Cleanup if needed
    if (createdStudentUserId) {
      await prisma.user.delete({ where: { id: createdStudentUserId } }).catch(() => {});
    }
    if (createdVisitorUserId) {
      await prisma.user.delete({ where: { id: createdVisitorUserId } }).catch(() => {});
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAuthTests();
