/**
 * Create Test User Script
 * 
 * Creates a test user for development/testing
 * Usage: npx tsx scripts/create-test-user.ts
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../apps/api/src/utils/password';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Get or create test organization
    let org = await prisma.organization.findFirst({
      where: { name: 'Test Organization' },
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: 'test-org',
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
        email: 'test@example.com',
      },
    });

    if (existingUser) {
      console.log('ℹ️  User already exists: test@example.com');
      console.log('   Password: test123456');
      return;
    }

    // Create test user
    const passwordHash = await hashPassword('test123456');
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        organizationId: org.id,
        isActive: true,
      },
    });

    console.log('✅ Created test user:');
    console.log('   Email: test@example.com');
    console.log('   Password: test123456');
    console.log('   Role: ADMIN');
    console.log('   User ID:', user.id);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();

