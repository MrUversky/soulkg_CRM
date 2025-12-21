/**
 * Database package exports
 * 
 * Provides Prisma client and database utilities
 */

import { PrismaClient } from '@prisma/client';

// Singleton Prisma client instance
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Export Prisma types
export * from '@prisma/client';

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

