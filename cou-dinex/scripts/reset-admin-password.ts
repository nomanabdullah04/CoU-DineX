import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  const newPassword = 'Admin@123';

  const hashed = await hashPassword(newPassword);

  const updated = await prisma.user.updateMany({
    where: { email: 'admin@cou.ac.bd' },
    data: { passwordHash: hashed },
  });

  if (updated.count === 0) {
    console.log('❌ admin@cou.ac.bd not found! Creating admin user...');

    const created = await prisma.user.create({
      data: {
        phone: '01700000000',
        email: 'admin@cou.ac.bd',
        fullName: 'Comilla University Dining Admin',
        passwordHash: hashed,
        role: 'SUPER_ADMIN',
        isActive: true,
        isEmailVerified: true,
      },
    });
    console.log(`✅ Admin user created: ${created.email}`);
  } else {
    console.log(`✅ Password updated for admin@cou.ac.bd`);
  }

  console.log('\n=== ADMIN LOGIN CREDENTIALS ===');
  console.log('Email    : admin@cou.ac.bd');
  console.log('Password : Admin@123');
  console.log('URL      : http://localhost:3000/login');
  console.log('================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
