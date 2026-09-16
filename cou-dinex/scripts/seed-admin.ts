import { PrismaClient, Role, StudentVerificationStatus, VerificationMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CoU DineX Phase 4 Admin & Student Verification Data...");

  const passwordHash = await bcrypt.hash("AdminPass123!", 10);
  const studentPasswordHash = await bcrypt.hash("Student123!", 10);

  // 1. Seed Super Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@cou.ac.bd" },
    update: {
      fullName: "Comilla University Dining Admin",
      role: Role.SUPER_ADMIN,
      passwordHash,
      isActive: true,
      isEmailVerified: true,
    },
    create: {
      email: "admin@cou.ac.bd",
      phone: "01700000000",
      fullName: "Comilla University Dining Admin",
      role: Role.SUPER_ADMIN,
      passwordHash,
      isActive: true,
      isEmailVerified: true,
    },
  });
  console.log(`✅ Admin user ready: ${admin.email} (Role: ${admin.role})`);

  // Get CSE and ICT departments
  const cseDept = await prisma.department.findFirst({ where: { code: "CSE" } });
  const ictDept = await prisma.department.findFirst({ where: { code: "ICT" } });
  const deptId = cseDept?.id || ictDept?.id;

  if (!deptId) {
    console.error("❌ No department found. Please seed departments first.");
    return;
  }

  // 2. Seed Test Students in various verification states
  const testStudents = [
    {
      email: "noman.pending@cou.ac.bd",
      phone: "01711111111",
      name: "Noman Abdullah",
      studentId: "11908001",
      session: "2022-2023",
      status: StudentVerificationStatus.PENDING,
      reason: null,
    },
    {
      email: "fatima.approved@cou.ac.bd",
      phone: "01722222222",
      name: "Fatima Tuz Zohra",
      studentId: "11908002",
      session: "2021-2022",
      status: StudentVerificationStatus.APPROVED,
      reason: null,
      verifiedBy: "Admin",
      verifiedAt: new Date(),
    },
    {
      email: "tanvir.rejected@cou.ac.bd",
      phone: "01733333333",
      name: "Tanvir Hasan",
      studentId: "11908003",
      session: "2020-2021",
      status: StudentVerificationStatus.REJECTED,
      reason: "University ID card photo was blurry and name mismatched departmental records.",
      verifiedBy: "Admin",
      verifiedAt: new Date(),
    },
    {
      email: "sumaiya.moreinfo@cou.ac.bd",
      phone: "01744444444",
      name: "Sumaiya Akter",
      studentId: "11908004",
      session: "2023-2024",
      status: StudentVerificationStatus.MORE_INFO_REQUIRED,
      reason: "Please verify your academic session and update department if enrolled under evening program.",
      verifiedBy: "Admin",
      verifiedAt: new Date(),
    },
  ];

  for (const s of testStudents) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {
        fullName: s.name,
        role: Role.STUDENT,
        passwordHash: studentPasswordHash,
        isActive: true,
        isEmailVerified: true,
      },
      create: {
        email: s.email,
        phone: s.phone,
        fullName: s.name,
        role: Role.STUDENT,
        passwordHash: studentPasswordHash,
        isActive: true,
        isEmailVerified: true,
      },
    });

    await prisma.student.upsert({
      where: { universityStudentId: s.studentId },
      update: {
        departmentId: deptId,
        session: s.session,
        verificationStatus: s.status,
        verificationMethod: VerificationMethod.ADMIN,
        verifiedBy: s.verifiedBy || null,
        verifiedAt: s.verifiedAt || null,
        rejectionReason: s.reason || null,
      },
      create: {
        userId: user.id,
        universityStudentId: s.studentId,
        departmentId: deptId,
        session: s.session,
        verificationStatus: s.status,
        verificationMethod: VerificationMethod.ADMIN,
        verifiedBy: s.verifiedBy || null,
        verifiedAt: s.verifiedAt || null,
        rejectionReason: s.reason || null,
      },
    });
    console.log(`✅ Seeded student: ${s.name} (${s.studentId}) -> [${s.status}]`);
  }

  console.log("🎉 Phase 4 Seeding Complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
