import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  const password = "Student@123";
  const passwordHash = await hashPassword(password);

  // Update all student users
  await prisma.user.updateMany({
    where: { role: "STUDENT" },
    data: { passwordHash, isActive: true },
  });

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: { student: true },
  });

  console.log("\n========================================================");
  console.log("🎓 STUDENT LOGIN CREDENTIALS");
  console.log("========================================================");
  students.forEach((s) => {
    console.log(`\nName       : ${s.fullName}`);
    console.log(`Email      : ${s.email}`);
    console.log(`Phone      : ${s.phone}`);
    console.log(`Student ID : ${s.student?.universityStudentId || "N/A"}`);
    console.log(`Password   : ${password}`);
    console.log(`Status     : ${s.student?.verificationStatus || "N/A"}`);
  });
  console.log("\n========================================================\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
