/**
 * Database seed
 *
 * Creates:
 *  - One admin user (from env vars)
 *  - Default UserSettings for the admin
 *
 * Run: pnpm prisma:seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminName = process.env.SEED_ADMIN_NAME ?? 'Admin';

  if (!adminEmail) {
    console.log('⚠️  SEED_ADMIN_EMAIL not set — skipping admin user creation.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    console.log(`✅ Admin user already exists: ${adminEmail}`);
    return;
  }

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
      role: 'ADMIN',
      profileCompleted: true,
      emailVerified: new Date(),
      settings: {
        create: {},
      },
    },
  });

  console.log(`✅ Created admin user: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
