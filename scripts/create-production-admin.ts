/**
 * Create Production Admin Script
 * 
 * Creates an admin user in production database
 * Usage: DATABASE_URL="postgresql://..." npx tsx scripts/create-production-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../apps/api/src/utils/password';

const prisma = new PrismaClient();

async function createProductionAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@soulkg.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123456';
  const orgName = process.env.ORG_NAME || 'Soul KG';

  try {
    console.log('🔧 Creating production admin...');
    console.log(`   Email: ${email}`);
    console.log(`   Organization: ${orgName}`);

    // Get or create organization
    let org = await prisma.organization.findFirst({
      where: { name: orgName },
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: orgName,
          slug: orgName.toLowerCase().replace(/\s+/g, '-'),
        },
      });
      console.log('✅ Created organization:', org.id);
    } else {
      console.log('✅ Using existing organization:', org.id);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        organizationId: org.id,
        email: email,
      },
    });

    if (existingUser) {
      console.log(`⚠️  User already exists: ${email}`);
      console.log('   To update password, delete user first or use update script');
      return;
    }

    // Create admin user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        organizationId: org.id,
        isActive: true,
      },
    });

    console.log('✅ Created admin user:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ADMIN`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Organization ID: ${org.id}`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createProductionAdmin();




