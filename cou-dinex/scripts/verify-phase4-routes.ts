import http from "http";
import { PrismaClient, Role } from "@prisma/client";
import { signSessionToken, AUTH_COOKIE_NAME } from "../src/lib/auth";

const prisma = new PrismaClient();

async function testPhase4Routes() {
  console.log("Testing Phase 4 Admin & Verification Routes on localhost:3000...\n");

  const admin = await prisma.user.findUnique({ where: { email: "admin@cou.ac.bd" } });
  if (!admin) {
    console.error("Admin user not found");
    return;
  }

  const student = await prisma.student.findFirst({ include: { user: true } });
  if (!student) {
    console.error("No student found");
    return;
  }

  const adminToken = await signSessionToken({
    userId: admin.id,
    email: admin.email,
    phone: admin.phone,
    fullName: admin.fullName,
    role: admin.role,
    isEmailVerified: admin.isEmailVerified,
  });

  const studentToken = await signSessionToken({
    userId: student.userId,
    email: student.user.email,
    phone: student.user.phone,
    fullName: student.user.fullName,
    role: Role.STUDENT,
    isEmailVerified: student.user.isEmailVerified,
  });

  const routes = [
    { path: "/admin", token: adminToken, role: "ADMIN", expectCode: 200 },
    { path: "/admin/verifications", token: adminToken, role: "ADMIN", expectCode: 200 },
    { path: `/admin/verifications/${student.id}`, token: adminToken, role: "ADMIN", expectCode: 200 },
    { path: "/student/verification-status", token: studentToken, role: "STUDENT", expectCode: 200 },
    { path: "/admin", token: studentToken, role: "STUDENT", expectCode: 307 }, // student blocked from admin
  ];

  for (const r of routes) {
    await new Promise((resolve) => {
      const options = {
        hostname: "localhost",
        port: 3000,
        path: r.path,
        method: "GET",
        headers: {
          Cookie: `${AUTH_COOKIE_NAME}=${r.token}`,
        },
      };

      const req = http.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => {
          const pass = res.statusCode === r.expectCode;
          console.log(`[${pass ? "PASS" : "FAIL"}] ${r.path} (${r.role}) -> Status: ${res.statusCode} (Expected: ${r.expectCode}), Length: ${body.length}`);
          resolve(null);
        });
      });

      req.on("error", (e) => {
        console.error(`[FAIL] ${r.path} error:`, e.message);
        resolve(null);
      });

      req.end();
    });
  }

  await prisma.$disconnect();
}

testPhase4Routes();
