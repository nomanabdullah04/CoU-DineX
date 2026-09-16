import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  console.log('\n=== ALL USERS IN DATABASE ===');
  console.table(users.map(u => ({
    name: u.fullName,
    email: u.email || '—',
    phone: u.phone,
    role: u.role,
    active: u.isActive,
  })));

  const admins = users.filter(u => u.role === 'SUPER_ADMIN' || u.role === 'CAFETERIA_ADMIN');
  console.log(`\n✅ Admin users: ${admins.length}`);
  if (admins.length === 0) {
    console.log('⚠️  NO ADMIN USERS FOUND! You need to create or promote a user to SUPER_ADMIN.');
  } else {
    admins.forEach(a => console.log(`  → ${a.fullName} (${a.email || a.phone}) — ${a.role}`));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
