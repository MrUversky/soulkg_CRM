/**
 * Migrate Data to Production Script
 * 
 * Migrates data from local database to production database
 * 
 * Usage:
 *   LOCAL_DATABASE_URL="postgresql://..." \
 *   PRODUCTION_DATABASE_URL="postgresql://..." \
 *   npx tsx scripts/migrate-to-production.ts
 * 
 * Or set in .env:
 *   LOCAL_DATABASE_URL=...
 *   PRODUCTION_DATABASE_URL=...
 */

import { PrismaClient } from '@prisma/client';

const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PRODUCTION_DATABASE_URL,
    },
  },
});

async function migrateData() {
  if (!process.env.PRODUCTION_DATABASE_URL) {
    console.error('❌ PRODUCTION_DATABASE_URL is required');
    console.error('   Set it as environment variable or in .env file');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting data migration...');
    console.log(`   Local DB: ${process.env.LOCAL_DATABASE_URL ? 'Connected' : 'Using default'}`);
    console.log(`   Production DB: Connected`);

    // Migrate organizations
    console.log('\n📦 Migrating organizations...');
    const localOrgs = await localPrisma.organization.findMany();
    for (const org of localOrgs) {
      const existing = await productionPrisma.organization.findUnique({
        where: { id: org.id },
      });
      if (!existing) {
        await productionPrisma.organization.create({
          data: {
            id: org.id,
            name: org.name,
            slug: org.slug,
            settings: org.settings,
            createdAt: org.createdAt,
            updatedAt: org.updatedAt,
          },
        });
        console.log(`   ✅ Migrated organization: ${org.name}`);
      } else {
        console.log(`   ⏭️  Organization already exists: ${org.name}`);
      }
    }

    // Migrate users
    console.log('\n👥 Migrating users...');
    const localUsers = await localPrisma.user.findMany();
    for (const user of localUsers) {
      const existing = await productionPrisma.user.findUnique({
        where: { id: user.id },
      });
      if (!existing) {
        await productionPrisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            passwordHash: user.passwordHash,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organizationId: user.organizationId,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        });
        console.log(`   ✅ Migrated user: ${user.email}`);
      } else {
        console.log(`   ⏭️  User already exists: ${user.email}`);
      }
    }

    // Migrate clients
    console.log('\n👤 Migrating clients...');
    const localClients = await localPrisma.client.findMany();
    for (const client of localClients) {
      const existing = await productionPrisma.client.findUnique({
        where: { id: client.id },
      });
      if (!existing) {
        await productionPrisma.client.create({
          data: {
            id: client.id,
            organizationId: client.organizationId,
            phone: client.phone,
            name: client.name,
            email: client.email,
            status: client.status,
            preferredLanguage: client.preferredLanguage,
            culturalContext: client.culturalContext as any,
            createdAt: client.createdAt,
            updatedAt: client.updatedAt,
          },
        });
        console.log(`   ✅ Migrated client: ${client.name || client.phone}`);
      } else {
        console.log(`   ⏭️  Client already exists: ${client.name || client.phone}`);
      }
    }

    // Migrate conversations
    console.log('\n💬 Migrating conversations...');
    const localConversations = await localPrisma.conversation.findMany();
    for (const conv of localConversations) {
      const existing = await productionPrisma.conversation.findUnique({
        where: { id: conv.id },
      });
      if (!existing) {
        await productionPrisma.conversation.create({
          data: {
            id: conv.id,
            organizationId: conv.organizationId,
            clientId: conv.clientId,
            channel: conv.channel,
            status: conv.status,
            managerId: conv.managerId,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
          },
        });
        console.log(`   ✅ Migrated conversation: ${conv.id}`);
      }
    }

    // Migrate messages
    console.log('\n📨 Migrating messages...');
    const localMessages = await localPrisma.message.findMany();
    let migratedCount = 0;
    for (const msg of localMessages) {
      const existing = await productionPrisma.message.findUnique({
        where: { id: msg.id },
      });
      if (!existing) {
        await productionPrisma.message.create({
          data: {
            id: msg.id,
            conversationId: msg.conversationId,
            content: msg.content,
            direction: msg.direction,
            sender: msg.sender,
            status: msg.status,
            timestamp: msg.timestamp,
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt,
          },
        });
        migratedCount++;
      }
    }
    console.log(`   ✅ Migrated ${migratedCount} messages`);

    // Migrate agent configurations
    console.log('\n🤖 Migrating agent configurations...');
    const localAgents = await localPrisma.agentConfiguration.findMany();
    for (const agent of localAgents) {
      const existing = await productionPrisma.agentConfiguration.findUnique({
        where: { id: agent.id },
      });
      if (!existing) {
        await productionPrisma.agentConfiguration.create({
          data: {
            id: agent.id,
            organizationId: agent.organizationId,
            type: agent.type,
            name: agent.name,
            prompt: agent.prompt,
            settings: agent.settings as any,
            isActive: agent.isActive,
            createdAt: agent.createdAt,
            updatedAt: agent.updatedAt,
          },
        });
        console.log(`   ✅ Migrated agent: ${agent.name}`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await localPrisma.$disconnect();
    await productionPrisma.$disconnect();
  }
}

migrateData();

