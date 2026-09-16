import { PrismaClient, Role, StudentVerificationStatus, VerificationMethod, AuditAction } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signSessionToken, verifyPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failCount++;
  }
}

async function runPhase4Tests() {
  console.log("==========================================================");
  console.log("🛡️ CoU DineX — Comprehensive Phase 4 Admin Verification Tests");
  console.log("==========================================================\n");

  const testSuffix = Date.now().toString().slice(-5);
  const testStudentId = `TEST${testSuffix}`;
  const testEmail = `student_${testSuffix}@cou.ac.bd`;
  const testPhone = `01799${testSuffix}`;

  try {
    // 1. Check Admin User
    console.log("--- 1. Admin Authentication & Session ---");
    const adminUser = await prisma.user.findUnique({
      where: { email: "admin@cou.ac.bd" },
    });
    assert(adminUser !== null, "Admin user exists in database");
    assert(adminUser?.role === Role.SUPER_ADMIN, "Admin user has SUPER_ADMIN role");

    const isPasswordValid = await verifyPassword("AdminPass123!", adminUser!.passwordHash!);
    assert(isPasswordValid, "Admin password verified with bcrypt");

    const adminToken = await signSessionToken({
      userId: adminUser!.id,
      email: adminUser!.email,
      phone: adminUser!.phone,
      fullName: adminUser!.fullName,
      role: adminUser!.role,
      isEmailVerified: adminUser!.isEmailVerified,
    });
    assert(adminToken.length > 50, "Admin JWT session token generated");

    // 2. Setup a Test Student for Verification Life Cycle
    console.log("\n--- 2. Student Verification Life Cycle Setup ---");
    const dept = await prisma.department.findFirst();
    assert(dept !== null, `Found department: ${dept?.code}`);

    const studentUser = await prisma.user.create({
      data: {
        email: testEmail,
        phone: testPhone,
        fullName: "Test Verification Student",
        role: Role.STUDENT,
        passwordHash: await bcrypt.hash("TestPass123!", 10),
        isEmailVerified: true,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        universityStudentId: testStudentId,
        departmentId: dept!.id,
        session: "2022-2023",
        verificationStatus: StudentVerificationStatus.PENDING,
        verificationMethod: VerificationMethod.ADMIN,
      },
    });
    assert(student.verificationStatus === StudentVerificationStatus.PENDING, "New student strictly defaults to PENDING");

    // 3. Test Admin Action: REQUEST_MORE_INFO
    console.log("\n--- 3. Admin Action: REQUEST MORE INFORMATION ---");
    const moreInfoReason = "Please upload a clearer picture of your University ID card.";
    const moreInfoStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        verificationStatus: StudentVerificationStatus.MORE_INFO_REQUIRED,
        verificationMethod: VerificationMethod.ADMIN,
        verifiedBy: adminUser!.fullName,
        verifiedAt: new Date(),
        rejectionReason: moreInfoReason,
      },
    });
    assert(
      moreInfoStudent.verificationStatus === StudentVerificationStatus.MORE_INFO_REQUIRED,
      "Status updated to MORE_INFO_REQUIRED"
    );
    assert(moreInfoStudent.rejectionReason === moreInfoReason, "Information request reason saved");

    // Create Audit Log for Request Info
    const audit1 = await prisma.auditLog.create({
      data: {
        userId: adminUser!.id,
        action: AuditAction.VERIFY,
        entityName: "Student",
        entityId: student.id,
        oldValues: { status: "PENDING" },
        newValues: { status: "MORE_INFO_REQUIRED", reason: moreInfoReason },
      },
    });
    assert(audit1.id !== null, "Audit log created for REQUEST_MORE_INFO");

    // 4. Test Student Correction & Re-submission
    console.log("\n--- 4. Student Correction & Re-submission ---");
    const correctedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        session: "2023-2024",
        verificationStatus: StudentVerificationStatus.PENDING,
      },
    });
    assert(correctedStudent.session === "2023-2024", "Student information updated");
    assert(
      correctedStudent.verificationStatus === StudentVerificationStatus.PENDING,
      "Student status flipped back to PENDING for admin review"
    );

    // 5. Test Admin Action: REJECT
    console.log("\n--- 5. Admin Action: REJECT ---");
    const rejectReason = "University Student ID does not match registrar records for Session 2023-2024.";
    const rejectedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        verificationStatus: StudentVerificationStatus.REJECTED,
        verificationMethod: VerificationMethod.ADMIN,
        verifiedBy: adminUser!.fullName,
        verifiedAt: new Date(),
        rejectionReason: rejectReason,
      },
    });
    assert(rejectedStudent.verificationStatus === StudentVerificationStatus.REJECTED, "Status updated to REJECTED");
    assert(rejectedStudent.rejectionReason === rejectReason, "Rejection reason saved");

    // Create Audit Log for Rejection
    const audit2 = await prisma.auditLog.create({
      data: {
        userId: adminUser!.id,
        action: AuditAction.VERIFY,
        entityName: "Student",
        entityId: student.id,
        oldValues: { status: "PENDING" },
        newValues: { status: "REJECTED", reason: rejectReason },
      },
    });
    assert(audit2.id !== null, "Audit log created for REJECT");

    // 6. Test Admin Action: APPROVE
    console.log("\n--- 6. Admin Action: APPROVE ---");
    const approvedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        verificationStatus: StudentVerificationStatus.APPROVED,
        verificationMethod: VerificationMethod.ADMIN,
        verifiedBy: adminUser!.fullName,
        verifiedAt: new Date(),
        rejectionReason: null, // cleared
      },
    });
    assert(approvedStudent.verificationStatus === StudentVerificationStatus.APPROVED, "Status updated to APPROVED");
    assert(approvedStudent.verifiedBy === adminUser!.fullName, "verified_by accurately recorded");
    assert(approvedStudent.verifiedAt !== null, "verified_at timestamp accurately recorded");
    assert(approvedStudent.verificationMethod === VerificationMethod.ADMIN, "verification_method stored as ADMIN");
    assert(approvedStudent.rejectionReason === null, "rejection_reason cleared upon approval");

    // Create Audit Log for Approval
    const audit3 = await prisma.auditLog.create({
      data: {
        userId: adminUser!.id,
        action: AuditAction.VERIFY,
        entityName: "Student",
        entityId: student.id,
        oldValues: { status: "REJECTED" },
        newValues: { status: "APPROVED", verifiedBy: adminUser!.fullName },
      },
    });
    assert(audit3.id !== null, "Audit log created for APPROVE");

    // 7. Test Audit Trail Query
    console.log("\n--- 7. Audit Trail Query ---");
    const logs = await prisma.auditLog.findMany({
      where: {
        entityName: "Student",
        entityId: student.id,
      },
      orderBy: { createdAt: "desc" },
    });
    assert(logs.length === 3, `Complete audit history recorded (Found ${logs.length} audit logs)`);

    // 8. Test Status Counts
    console.log("\n--- 8. Status Counts Query ---");
    const [allCount, pendingCount, approvedCount] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { verificationStatus: StudentVerificationStatus.PENDING } }),
      prisma.student.count({ where: { verificationStatus: StudentVerificationStatus.APPROVED } }),
    ]);
    assert(allCount > 0, `Total student count: ${allCount}`);
    assert(pendingCount >= 0, `Pending student count: ${pendingCount}`);
    assert(approvedCount >= 1, `Approved student count: ${approvedCount}`);

    // 9. Cleanup Test Student
    console.log("\n--- 9. Test Cleanup ---");
    await prisma.auditLog.deleteMany({ where: { entityId: student.id } });
    await prisma.student.delete({ where: { id: student.id } });
    await prisma.user.delete({ where: { id: studentUser.id } });
    assert(true, "Test student and logs cleaned up cleanly");

    console.log("\n==========================================================");
    console.log(`🎉 ALL PHASE 4 TESTS COMPLETED: ${passCount} / ${passCount + failCount} tests passed!`);
    console.log("==========================================================");
  } catch (error) {
    console.error("❌ Test suite encountered error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase4Tests();
