/**
 * Test script to import 1 message from WhatsApp
 * 
 * Usage:
 *   npx tsx scripts/test-import-one-message.ts <organizationId>
 * 
 * This script:
 * 1. Creates DataImportService
 * 2. Initializes WhatsApp connection
 * 3. Waits for QR code (user needs to scan)
 * 4. Imports 1 contact with messages (limit: 1)
 * 5. Shows results
 */

import { DataImportService } from '@soul-kg-crm/data-import';
import { prisma } from '@soul-kg-crm/database';
// @ts-ignore - qrcode-terminal doesn't have types
import qrcode from 'qrcode-terminal';

async function main() {
  // Get organization ID from command line or use first available
  const organizationId = process.argv[2];
  
  if (!organizationId) {
    console.log('📋 Available organizations:');
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true },
      take: 5,
    });
    
    if (orgs.length === 0) {
      console.error('❌ No organizations found. Please create one first.');
      process.exit(1);
    }
    
    orgs.forEach((org, i) => {
      console.log(`  ${i + 1}. ${org.name} (${org.id})`);
    });
    
    console.log('\nUsage: npx tsx scripts/test-import-one-message.ts <organizationId>');
    console.log(`Example: npx tsx scripts/test-import-one-message.ts ${orgs[0].id}`);
    process.exit(0);
  }

  // Verify organization exists
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true },
  });

  if (!org) {
    console.error(`❌ Organization ${organizationId} not found`);
    process.exit(1);
  }

  console.log(`\n🚀 Starting test import for organization: ${org.name} (${org.id})\n`);

  // Create import service
  const importService = new DataImportService(organizationId);

  try {
    // Initialize WhatsApp connection
    console.log('📱 Initializing WhatsApp connection...\n');
    
    // Start initialization in background and wait for QR code if needed
    let qrCodeReceived = false;
    const initPromise = importService.initialize().catch((error) => {
      // Don't fail immediately - QR code might be needed
      if (!error.message.includes('timeout')) {
        throw error;
      }
    });
    
    // Try to get QR code (will return null if session exists)
    console.log('📷 Checking for QR code...');
    const qrCode = await Promise.race([
      importService.getQRCode(),
      new Promise<string | null>((resolve) => {
        setTimeout(() => resolve(null), 5000); // Timeout after 5 seconds
      }),
    ]);
    
    if (qrCode) {
      qrCodeReceived = true;
      // Display QR code in terminal
      console.log('\n📱 Scan this QR code with WhatsApp:\n');
      qrcode.generate(qrCode, { small: true });
      console.log('\n⏳ Waiting for authentication... (scan QR code above, you have 2 minutes)\n');
      
      // Wait longer for user to scan QR code
      await new Promise(resolve => setTimeout(resolve, 120000)); // Wait 2 minutes
    } else {
      console.log('   ℹ️  No QR code needed - checking for existing session...');
    }
    
    // Now wait for initialization to complete
    await initPromise;

    // Start import with limit: 1 (only 1 contact)
    console.log('📥 Starting import (limit: 1 contact)...\n');
    const result = await importService.startImport({
      organizationId,
      importContacts: true,
      importMessages: true,
      detectStatus: true,
      skipDuplicates: false, // Don't skip for testing
      dryRun: false,
      limit: 1, // Only import 1 contact
    });

    // Display results
    console.log('\n✅ Import completed!\n');
    console.log('📊 Results:');
    console.log(`  Import ID: ${result.importId}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Total chats: ${result.totalChats}`);
    console.log(`  Processed chats: ${result.processedChats}`);
    console.log(`  Successful imports: ${result.successfulImports}`);
    console.log(`  Failed imports: ${result.failedImports}`);
    console.log(`  Skipped duplicates: ${result.skippedDuplicates}`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.chat}: ${error.error}`);
      });
    }

    // Disconnect
    await importService.disconnect();
    console.log('\n✅ Disconnected from WhatsApp\n');

  } catch (error) {
    console.error('\n❌ Error during import:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    
    try {
      await importService.disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting:', disconnectError);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

